import React, { useState } from 'react'
import { useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

//Importing icons
import { Upload, X, Loader2, XCircle, LoaderCircle } from 'lucide-react';
import { FileText } from 'lucide-react';

function MultiAdd() {
  const {user} = useContext(AuthContext)
  const fileInputRef = useRef(null) 
  const [selectedFile, setSelectedFile] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showViewAllPopup, setShowViewAllPopup] = useState(false)
  const [activeTab, setActiveTab] = useState('pdf') // 'excel' | 'pdf'
  const [uploadSummary, setUploadSummary] = useState(null)
  const [excelPreview, setExcelPreview] = useState({ columns: [], rows: [], meta: null })
  const [showExcelPreviewModal, setShowExcelPreviewModal] = useState(false)
  const [excelDatabaseResult, setExcelDatabaseResult] = useState(null)
  const [pdfJobId, setPdfJobId] = useState(null)
  const [pdfProcessingStatus, setPdfProcessingStatus] = useState(null)

  const handleFileSelect = (e) =>{
    const files = e.target.files 
    if(files) {
      const allowed = activeTab === 'excel'
        ? [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
          ]
        : [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]

      const filteredFiles = Array.from(files).filter((file) => allowed.includes(file.type))
      setSelectedFile(prev => [...prev, ...filteredFiles])
    }
  } 

  const handleDragOver = (e) =>{
    e.preventDefault()
  }

  const handleDrop = (e) =>{
      e.preventDefault()
      const files = e.dataTransfer.files
      if(files){
        const allowed = activeTab === 'excel'
          ? [
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-excel',
              'text/csv',
            ]
          : [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]
        const filteredFiles = Array.from(files).filter((file) => allowed.includes(file.type))
        setSelectedFile(prev => [...prev, ...filteredFiles])
      }
  }

  const handleSubmit = async () => {
    try {
      setIsUploading(true)
      if (activeTab === 'excel') {
        if (selectedFile.length === 0) return
        if (selectedFile.length > 1) {
          toast.info('Multiple files selected. Only the first Excel file will be used.')
        }
        const excelFile = selectedFile[0]
        const previewForm = new FormData()
        previewForm.append('file', excelFile)
        previewForm.append('sheet_name', '')
        previewForm.append('skip_empty_rows', 'true')
        previewForm.append('normalize_headers', 'true')
        previewForm.append('max_rows', '0')

        const response = await axios.post(`${process.env.REACT_APP_AI_URL}/resume-parser/excel-to-json`, previewForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            setUploadProgress(Math.round(progress))
          }
        })

        const dataRows = Array.isArray(response?.data?.data) ? response.data.data : []
        const columns = dataRows.length > 0 ? Object.keys(dataRows[0]) : []
        setExcelPreview({
          columns,
          rows: dataRows,
          meta: {
            filename: response?.data?.filename || excelFile?.name,
            statistics: response?.data?.statistics,
            settings: response?.data?.settings,
            sheet_name: response?.data?.sheet_name ?? ''
          }
        })
        setShowExcelPreviewModal(true)
      } else {
        const formData = new FormData()
        selectedFile.forEach((file) => {
          formData.append('files', file)
        })
        formData.append('user_id', user._id)
        formData.append('user_name', user.full_name)

        const response = await axios.post(`${process.env.REACT_APP_AI_URL}/resume-parser/multiple`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            setUploadProgress(Math.round(progress))
          }
        })

        if (response?.data?.job_id) {
          setPdfJobId(response.data.job_id)
          toast.success('PDF processing started!')
          // Start polling for status
          setTimeout(() => pollJobStatus(response.data.job_id), 2000)
        } else {
          toast.error('Failed to start PDF processing')
          setIsUploading(false)
          setUploadProgress(0)
        }

        setSelectedFile([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Something went wrong!')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // console.log(uploadSummary)
  // console.log('successfully---->',uploadSummary?.successfully_parsed_resumes)
  // console.log('successfully database---->',uploadSummary?.successfully_saved_to_database)
  // console.log('duplicate database----->', uploadSummary?.duplicate_content_resumes)
  // console.log('error---->', uploadSummary?.failed_to_parse_resumes)
  // console.log('error database----->',uploadSummary?.failed_to_save_to_database)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const clearAllFiles = () => {
    setSelectedFile([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const pollJobStatus = async (jobId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_AI_URL}/resume-parser/status/${jobId}`, {
        headers: { 'accept': 'application/json' }
      })
      
      const status = response.data
      setPdfProcessingStatus(status)
      
      if (status.status === 'completed') {
        // Extract summary from metadata
        const summary = status.metadata?.summary || {}
        setUploadSummary({
          total_files: summary.total_files || 0,
          processed_count: summary.processed_count || 0,
          successful_count: summary.successful_count || 0,
          failed_count: summary.failed_count || 0,
          skipped_count: summary.skipped_count || 0,
          accuracy_rate: summary.accuracy_rate || 0,
          results: status.metadata?.results || []
        })
        setIsUploading(false)
        setUploadProgress(0)
        setPdfJobId(null)
        toast.success('PDF processing completed!')
        return
      } else if (status.status === 'failed') {
        toast.error('PDF processing failed!')
        setIsUploading(false)
        setUploadProgress(0)
        setPdfJobId(null)
        return
      }
      
      // Continue polling if still processing
      setTimeout(() => pollJobStatus(jobId), 2000)
    } catch (error) {
      console.error('Error polling job status:', error)
      toast.error('Error checking processing status')
      setIsUploading(false)
      setUploadProgress(0)
      setPdfJobId(null)
    }
  }

  const removeFile = (index) =>{
    setSelectedFile((prev) => prev.filter((_,i) => index!==i))
    if(selectedFile.length <= 8) {
      setShowViewAllPopup(false)
    }
  }

  const handleExcelConfirm = async () => {
    try {
      if (selectedFile.length === 0) return
      setIsUploading(true)
      const excelFile = selectedFile[0]
      const form = new FormData()
      form.append('file', excelFile)
      form.append('user_name', user?.full_name || '')
      form.append('user_id', user?._id || '')
      form.append('sheet_name', excelPreview?.meta?.sheet_name ?? '')
      form.append('validation_level', 'standard')
      form.append('cleaning_aggressive', 'false')
      form.append('include_quality_scores', 'true')

      const resp = await axios.post(`${process.env.REACT_APP_AI_URL}/resume-parser/excel`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          setUploadProgress(Math.round(progress))
        }
      })

      toast.success(resp?.data?.message || 'Excel processing started')
      const sessionId = resp?.data?.session_id
      setShowExcelPreviewModal(false)
      if (!sessionId) {
        toast.error('No session id returned from server')
        return
      }

      // Fetch processing results
      const resultsResp = await axios.get(`${process.env.REACT_APP_AI_URL}/resume-parser/results/${sessionId}`, {
        headers: { 'accept': 'application/json' }
      })

      const dbResult = resultsResp?.data?.database_result || null
      setExcelDatabaseResult(dbResult)
      // Clear selected files from right side
      setSelectedFile([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start Excel processing')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Upload Progress Popup
  const UploadProgressPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-sm font-medium">{uploadProgress}%</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold">
          {activeTab === 'pdf' ? 'Processing PDF Files...' : 'Uploading Files...'}
        </h2>
        <p className="text-gray-500">
          {activeTab === 'pdf' 
            ? 'Please wait while we process your PDF files' 
            : 'Please wait while we process your files'
          }
        </p>
        {pdfProcessingStatus && (
          <div className="text-sm text-gray-600 text-center">
            <p>Status: {pdfProcessingStatus.status}</p>
            {pdfProcessingStatus.current_item && (
              <p className="mt-1">Processing: {pdfProcessingStatus.current_item}</p>
            )}
            {pdfProcessingStatus.progress_percentage && (
              <p className="mt-1">Progress: {pdfProcessingStatus.progress_percentage}%</p>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // View All Files Popup
  const ViewAllPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Files ({selectedFile.length})</h2>
          <button onClick={() => setShowViewAllPopup(false)} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="flex flex-col gap-2">
            {selectedFile.map((file, index) => (
              <div key={index} className="p-3 border rounded-lg border-neutral-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={34} className="text-red-500" />
                  <div className="flex flex-col">
                    <h1>{file.name}</h1>
                    <span className="text-sm text-gray-400">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <X
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-600 transition-all duration-300 cursor-pointer"
                  size={20}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-center">
          <span>Total Files: {selectedFile.length}</span>
          <span>Total Size: {formatFileSize(selectedFile.reduce((acc,file)=> acc + file.size , 0))}</span>
        </div>
      </div>
    </div>
  )

  const ExcelPreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[90vw] max-w-6xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Excel Preview</h2>
            {excelPreview?.meta?.filename && (
              <span className="text-sm text-gray-500">{excelPreview.meta.filename}</span>
            )}
          </div>
          <button onClick={() => setShowExcelPreviewModal(false)} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="w-full overflow-auto max-h-[55vh]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {excelPreview.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-neutral-200 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelPreview.rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {excelPreview.columns.map((col) => (
                      <td key={col} className="px-3 py-2 align-top border-b border-neutral-100 whitespace-nowrap text-gray-800">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {excelPreview?.rows?.length || 0} rows • {excelPreview?.columns?.length || 0} columns
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExcelPreviewModal(false)}
              className="px-4 py-2 rounded-md border border-neutral-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleExcelConfirm}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              {
                isUploading ? 
                <LoaderCircle className='animate-spin'></LoaderCircle>
                : "Confirm"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className='w-full flex items-start gap-4'>
        {/* Upload resume section */}
        <div className='w-[58%] p-6 rounded-lg border border-neutral-200 bg-white flex flex-col gap-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Upload></Upload>
              <h1 className='font-semibold text-2xl'>Upload Multiple Resumes</h1>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => { setActiveTab('excel'); setSelectedFile([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className={`px-3 py-1 rounded-md border ${activeTab === 'excel' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-neutral-300'}`}
              >
                Excel
              </button>
              <button
                onClick={() => { setActiveTab('pdf'); setSelectedFile([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className={`px-3 py-1 rounded-md border ${activeTab === 'pdf' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-neutral-300'}`}
              >
                PDF
              </button>
            </div>
          </div>
          <div onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}  className='w-full flex justify-center items-center hover:border-neutral-400 transition-all duration-200 border-2 border-neutral-300 border-dashed rounded-lg h-56'>
              <div className='flex flex-col gap-2 items-center'>
                <Upload size={44} className='text-gray-400'></Upload>
                <h1 className='text-lg font-medium '>
                  {activeTab === 'excel' ? 'Drop your Excel files here, or click to browse' : 'Drop your resume files here, or click to browse'}
                </h1>
                <span className='text-neutral-400 text-[15px]'>You can select multiple files at once.</span>
                <button className='p-2 mt-2 hover:bg-gray-100 transition-all duration-300 border-neutral-200 border rounded-lg'>
                  Choose Files
                </button>
                <input
                  className='hidden'
                  onChange={handleFileSelect}
                  accept={activeTab === 'excel' ? '.xlsx,.xls,.csv' : '.pdf,.doc,.docx'}
                  ref={fileInputRef}
                  type='file'
                  multiple
                ></input>
              </div>
          </div>
          <div className='flex justify-center items-center'>
            <button 
              onClick={handleSubmit}
              disabled={selectedFile.length === 0 || isUploading} 
              className='bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 p-2 text-white rounded-md w-52 flex items-center justify-center gap-2'
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Uploading...</span>
                </>
              ) : (
                activeTab === 'excel' ? 'Upload Excel' : 'Import Resume'
              )}
            </button>
          </div>
          {uploadSummary && (
            <div className='mt-6'>
              <h2 className='text-lg font-semibold mb-2'>Processing Results</h2>
              <div className='border border-neutral-200 rounded-lg p-4 max-h-72 overflow-y-auto'>
                <div className='space-y-4'>
                  {/* Summary Statistics */}
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='flex justify-between border-b pb-2'>
                      <span className='text-gray-600'>Total Files</span>
                      <span className='font-medium'>{uploadSummary?.total_files || 0}</span>
                    </div>
                    <div className='flex justify-between border-b pb-2'>
                      <span className='text-gray-600'>Processed</span>
                      <span className='font-medium'>{uploadSummary?.processed_count || 0}</span>
                    </div>
                    <div className='flex justify-between border-b pb-2'>
                      <span className='text-gray-600'>Successful</span>
                      <span className='font-medium text-green-600'>{uploadSummary?.successful_count || 0}</span>
                    </div>
                    <div className='flex justify-between border-b pb-2'>
                      <span className='text-gray-600'>Failed</span>
                      <span className='font-medium text-red-600'>{uploadSummary?.failed_count || 0}</span>
                    </div>
                    <div className='flex justify-between border-b pb-2'>
                      <span className='text-gray-600'>Skipped</span>
                      <span className='font-medium text-yellow-600'>{uploadSummary?.skipped_count || 0}</span>
                    </div>
                    <div className='flex justify-between border-b pb-2'>
                      <span className='text-gray-600'>Accuracy Rate</span>
                      <span className='font-medium'>{((uploadSummary?.accuracy_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  {uploadSummary?.results && uploadSummary.results.length > 0 && (
                    <div>
                      <h3 className='font-medium mb-2'>File Details</h3>
                      <div className='space-y-2'>
                        {uploadSummary.results.map((result, idx) => (
                          <div key={`result-${idx}`} className='p-3 border rounded-lg border-neutral-200'>
                            <div className='flex justify-between items-start'>
                              <div className='flex flex-col'>
                                <span className='font-medium'>{result.filename}</span>
                                <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                  {result.success ? 'Success' : 'Failed'}
                                </span>
                              </div>
                              {result.error && (
                                <div className='text-xs text-gray-500 max-w-xs truncate' title={result.error}>
                                  {result.error}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {excelDatabaseResult && (
            <div className='mt-6'>
              <h2 className='text-lg font-semibold mb-2'>Excel Import Database Result</h2>
              <div className='border border-neutral-200 rounded-lg p-4'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div className='flex justify-between border-b pb-2'>
                    <span className='text-gray-600'>Total Resumes</span>
                    <span className='font-medium'>{excelDatabaseResult?.total_resumes ?? 0}</span>
                  </div>
                  <div className='flex justify-between border-b pb-2'>
                    <span className='text-gray-600'>Successfully Saved</span>
                    <span className='font-medium'>{excelDatabaseResult?.successfully_saved ?? 0}</span>
                  </div>
                  <div className='flex justify-between border-b pb-2'>
                    <span className='text-gray-600'>Duplicates Found</span>
                    <span className='font-medium'>{excelDatabaseResult?.duplicates_found ?? 0}</span>
                  </div>
                  <div className='flex justify-between border-b pb-2'>
                    <span className='text-gray-600'>Updated Records</span>
                    <span className='font-medium'>{excelDatabaseResult?.updated_records ?? 0}</span>
                  </div>
                </div>
                {(excelDatabaseResult?.errors?.length || 0) > 0 && (
                  <div className='mt-4'>
                    <h3 className='font-medium'>Errors ({excelDatabaseResult.errors.length})</h3>
                    <ul className='list-disc list-inside text-sm text-red-600 max-h-40 overflow-y-auto'>
                      {excelDatabaseResult.errors.map((err, idx) => (
                        <li key={`db-err-${idx}`}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Resume section */}
        <div className={`w-[42%] p-6 rounded-lg border border-neutral-200 ${selectedFile.length===0 ? 'bg-gray-100' : 'bg-white'} flex items-center justify-center`}>
             {
                 selectedFile.length === 0 ? 
                 (
                    <div className='flex flex-col gap-4 items-center'>
                          <FileText className='text-gray-300' size={40}></FileText>
                          <h1 className='text-center text-neutral-400'>
                            {activeTab === 'excel' ? 'No files selected yet, upload some Excel files to see them listed here.' : 'No files selected yet, Upload some resumes to see them listed here.'}
                          </h1>
                    </div>
                 ) : (
                    <div className='flex w-full flex-col gap-2'>
                        <div className='w-full flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                               <FileText size={22}></FileText>
                               <h1 className='text-lg font-semibold'>Selected Files ({selectedFile.length})</h1>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedFile.length > 8 && (
                                <button 
                                  onClick={() => setShowViewAllPopup(true)}
                                  className='p-2 text-sm hover:bg-gray-100 transition-all duration-300 border border-neutral-300 rounded-lg'
                                >
                                  View All
                                </button>
                              )}
                              <button className='p-2 text-sm hover:bg-gray-100 transition-all duration-300 border border-neutral-300 rounded-lg' onClick={clearAllFiles}>
                                Clear all
                              </button>
                            </div>
                        </div>
                        <div className='flex mt-4 flex-col gap-2'>
                          {
                            selectedFile.slice(0, 8).map((file, index)=>(
                              <div key={index} className='p-3 border rounded-lg border-neutral-200 flex justify-between items-center'>
                                 <div className='flex items-center gap-2'>
                                   <FileText size={34} className='text-red-500'></FileText>
                                   <div className='flex flex-col'>
                                      <h1>{file.name}</h1>
                                      <span className='text-sm text-gray-400'>{formatFileSize(file.size)}</span>
                                   </div>
                                 </div>
                                 <X onClick={()=>removeFile(index)} className='text-red-500 hover:text-red-600 transition-all duration-300 cursor-pointer' size={20}></X>
                              </div>
                            ))
                          }
                          {selectedFile.length > 8 && (
                            <button 
                              onClick={() => setShowViewAllPopup(true)}
                              className='p-2 text-sm text-blue-500 hover:bg-blue-50 transition-all duration-300 border border-blue-300 rounded-lg'
                            >
                              + {selectedFile.length - 8} more files
                            </button>
                          )}
                        </div>
                        <div className='p-4 mt-4 border-t border-neutral-200 flex justify-between items-center'>
                            <span>Total Files: {selectedFile.length}</span>
                            <span>Total Size: {formatFileSize(selectedFile.reduce((acc,file)=> acc + file.size , 0))}</span>
                        </div>
                    </div>
                 )
             }
        </div>

        {/* Popups */}
        {isUploading && <UploadProgressPopup />}
        {showViewAllPopup && <ViewAllPopup />}
        {showExcelPreviewModal && <ExcelPreviewModal />}
    </div>
  )
}

export default MultiAdd