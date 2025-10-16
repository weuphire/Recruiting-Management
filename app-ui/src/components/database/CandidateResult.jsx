import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import SendInvite from './SendInvite';
import Activity from './Activity';

import {toast} from 'react-toastify'

import FilterBox from './FilterBox';

import ScheduleJob from './ScheduleJob';

//Importing icons
import { BriefcaseBusiness, Calendar, LoaderCircle, X } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Mail } from 'lucide-react';
import { Phone } from 'lucide-react';
import { Star } from 'lucide-react';
import { UserRound } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { Copy } from 'lucide-react';
import { SquarePen } from 'lucide-react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';



//Importing images
import PROFILE from '../../assets/profile.png'
import Watsapp from '../../assets/whatsapp.png'
import EMail from '../../assets/email.png'
import WEB from '../../assets/internet.png'
import LINK from '../../assets/linkedin.png'
import N from '../../assets/n.png'

import axios from 'axios';
import SendAllInvite from './SendAllInvite';



const handleGetSkills = (skills,matched_skills) =>{
  let matched = matched_skills || []
  if(skills.length>4){
     return (
       <div className='flex items-center flex-wrap gap-2'>
          {
           skills.slice(0,4).map((item,index) => (
             <span key={index} className={`p-0.5 px-2 ${matched.includes(item) ? 'bg-[#ffe991]' : 'text-gray-500 bg-gray-200'} text-sm rounded-xl`}>{item}</span>
           ))
          }
          <span className='p-0.5 px-2 text-sm bg-white border rounded-xl'>{skills.length-4}+</span>
       </div>
     )
  }else{
    return (
     <div className='flex items-center gap-2'>
     { 
     skills.map((item,index) => {
       let flag = matched.includes(item)
       return (
       <span key={index} className={`p-0.5 px-2 text-sm ${flag ? 'bg-[#ffe991]' : 'text-gray-500 bg-gray-200'} rounded-xl`}>{item}</span>
       )
     })
     }
     </div>
    )
  }
}

function formatDateToMonthYear(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString; // e.g. 'Present' → return 'Present'
  }
  
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

const hideMobileNo = (mobileno) =>{
  if(!mobileno) return ''
   let digit = mobileno.slice(mobileno.length-2, mobileno.length)
   return "********"+digit
}

const getScoreColor = (score) => {
  if (score >= 85) return "#22c55e" // Green for 85%+
  if (score >= 50) return "#eab308" // Yellow for 50-84%
  return "#ef4444" // Red for <50%
}

function CandidateResult() {
  const {user} = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [loading,setLoading] = useState(false)

  const [openScheduleJob,setOpenScheduleJob] = useState(false)
  const [openInviteBox,setOpenInviteBox]= useState(false)
  const [inviteType, setInviteType] = useState('')
  const [openAllInviteBox,setOpenAllInvieBox] = useState(false)
  const [openActivity,setOpenActivity] = useState(false)
  const [selectedCandidate,setSelectedCandidate] = useState({})
  const [selectedCandidates,setSelectedCandidates] = useState([])
  const [showSearchDetails,setShowSearchDetails] = useState(false)

  const [payload,setPayload] = useState({})

  const [searchResults,setSearchResults] = useState([])
  const [filterSearchResults,setFilterSearchResults] = useState([])
  const [previewCandidate,setPreviewCandidate] = useState({})
  const [keywords,setKeywords] = useState([])
  const [loader,setLoader] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(60); // Number of candidates per page (dynamic)
  const totalPages = Math.ceil(filterSearchResults.length / pageSize);

  // Paginated results
  const paginatedResults = filterSearchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // When pageSize changes, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(()=>{
    if(!location.state){
        navigate('/')
    }else{
        setSearchResults(location.state.candidate_result)
        setFilterSearchResults(location.state.candidate_result)
        setPreviewCandidate(location.state.candidate_result[0])
        setPayload(location.state.payload)
        if(location.state.searchType === 'manually') setKeywords(location.state.payload.experience_titles)
    }
  },[])

  const handleSelectedCandidate = (item) =>{
      if(selectedCandidates.some((candidate) => candidate._id === item._id)){
         setSelectedCandidates((prev)=> prev.filter((candidate) => candidate._id !== item._id))
      }else{
        setSelectedCandidates((prev) => [...prev,item])
      }
  }

  const handleSelectAllCandidate = () =>{
     setSelectedCandidates([...filterSearchResults])
  }

  const handleDeselectAllCandidate = () =>{
    setSelectedCandidates([])
  }

  const [showMobileNo,setShowMobileNo] = useState(false)

  const handleViewMobileNo = async () =>{
     try{
       const data = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/activity`,{
        candidate_id:previewCandidate._id,
        candidate_name:previewCandidate?.contact_details?.name,
        recruiter_name:user?.full_name,
        recruiter_id:user?._id,
        comment:`${user.full_name} seen ${previewCandidate?.contact_details?.name} profile.`
       })
       setShowMobileNo(true)
     }catch(err){
       toast.error(err?.response?.data?.message || "Something went wrong.")
     }
  }


  const [selectedKeyword,setSelectedKeyword] = useState([])
  const [selectedSkills,setSelectedSkills] = useState([])
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [minSalary, setMinSalary] = useState('')
  const [maxSalary, setMaxSalary] = useState('')
  const [selectedCity,setSelectedCity] = useState([])
  const [education,setEducation] = useState('')

  const handleFilterSearchResults = (searchResults) => {
    if(!searchResults.length) return 

    const filtered = searchResults.filter(candidate => {
      const {labels = [],skills = [], total_experience } = candidate

      const keyWordMatch = selectedKeyword.length === 0 ||
      selectedKeyword.some((keyword)=> labels.map((label)=> label.toLowerCase()).includes(keyword.toLowerCase()))
   
      const skillMatch = selectedSkills.length === 0 ||
      selectedSkills.some((skill) => skills.map((sk)=> sk.toLowerCase()).includes(skill))

      const expMatch = (minExp === '' || total_experience>= minExp) && (maxExp === '' || total_experience<=maxExp)

      const salaryMatch = (minSalary === '' || candidate.current_salary >= minSalary) && (maxSalary === '' || candidate.current_salary <= maxSalary)

      return keyWordMatch && skillMatch && expMatch && salaryMatch
    })

    setFilterSearchResults(filtered)
    setPreviewCandidate(filtered[0])
  }

  useEffect(()=>{
     handleFilterSearchResults(searchResults)
  },[selectedKeyword, selectedSkills, minExp, maxExp, minSalary, maxSalary])
  

 const handleSaveResult = async () =>{
   setLoading(true)
   try{
      if(location.state.searchType==="manually"){
         await axios.post(`${process.env.REACT_APP_AI_URL}/manual_saved_recnet_search/save_search`,{
          ...payload,
          userid:user._id
         })
      }else{
         await axios.post(`${process.env.REACT_APP_AI_URL}/ai_search_operations/save_search`,{
          ...payload,
          user_id:user._id
         })
      }
     toast.success("Your search saved successfully.")
   }catch(err){
     toast.error("Something went wrong.")
     console.log(err)
   }finally{
    setLoading(false)
   }
 }

 const handleCopy = async (text) =>{
   try{
     await navigator.clipboard.writeText(text)
     toast.success(`${text} copied to clipboard.`)
   }catch(err){
     console.error('failed to copy',err)
   }
 }

 const handleOpenInviteBox = (candidate , type) =>{
    setSelectedCandidate(candidate)
    setInviteType(type)
    setOpenInviteBox(true)
 }

 const handleOpenAllInviteBox = () =>{
    setOpenAllInvieBox(true)
 }

 const handleCloseAllInviteBox = () =>{
    setSelectedCandidates([])
    setOpenAllInvieBox(false)
 }

 const handleOpenActivity = () =>{
   setSelectedCandidate(previewCandidate)
   setOpenActivity(true)
 } 

 const handleCloseActivity = () =>{
   setSelectedCandidate(null)
   setOpenActivity(false)
 }

 const handleOpenScheduleJob = (candidate) =>{
   setSelectedCandidate(candidate)
   setOpenScheduleJob(true)
 }

 const handleCloseScheduleJob = () =>{
  setSelectedCandidate(null)
  setOpenScheduleJob(false)
 }

 const handlePageChange = (page) => {
   if (page < 1 || page > totalPages) return;
   setCurrentPage(page);
 };

 const getSearchPrompt = (prompt) =>{
     if(!prompt) return ""
     if(prompt.length > 35){
      return <div className='flex items-center gap-1'>
          {
            showSearchDetails && (<div className='absolute p-4 shadow-lg z-50 flex flex-col gap-1 bg-white left-0 w-full top-[100%]'>
              <h1 className='text-[16px] font-semibold'>Showing results for</h1>
              <span className='text-[14px] leading-6 text-gray-500'>{prompt}</span>
            </div>)
          }
        <span>{prompt.slice(0,34)+'...'}</span>
        <span onClick={()=>setShowSearchDetails((prev)=>!prev)} className='text-blue-400 text-sm cursor-pointer'>View details</span>
      </div>
     }else{
      return prompt
     }
 }

 const handleRefetchData = async (idx) =>{
     let updatedKeywords = keywords.filter((item,index) => index !== idx)
     setKeywords(updatedKeywords)
     if(updatedKeywords.length > 0){
      try{
        let obj = {
          experience_titles: updatedKeywords,
          skills:payload.skills,
          min_experience:payload.min_experience,
          max_experience:payload.max_experience,
          min_education:payload.min_education,
          locations:payload.locations,
          min_salary:payload.min_salary,
          max_salary:payload.max_salary
        }
        setLoader(true)
        const response = await axios.post(`${process.env.REACT_APP_AI_URL}/manualsearch`,obj)
        setSearchResults(response.data)
        handleFilterSearchResults(response.data)
      }catch(err){
        console.log(err)
        toast.error('Something went wrong.')
      }finally{
        setLoader(false)
      }
     }
 }

 const getSearchKeyword = (keywords) =>{
  if(keywords.length === 0 ) return ""
  let searchStr = keywords.map((item,index) => `${item}`).join(', ')
  if(searchStr.length > 35){
    return <div className='flex items-center gap-1'>
        {
          showSearchDetails && (<div className='absolute p-4 shadow-lg z-50 flex flex-col gap-1 bg-white left-0 w-full top-[100%]'>
            <h1 className='text-[16px] font-semibold'>Showing results for</h1>
            <div className='flex items-center gap-2'>
            {
              searchStr.split(',').map((item,index) => (
                <div key={index} className='text-[12px] flex items-center gap-1 px-4 bg-[#dee1e5] rounded-md text-gray-500'>
                  <span>{item}</span>
                  <button onClick={()=>handleRefetchData(index)}><X size={15}></X></button>
                </div>
              ))
            }
            </div>
          </div>)
        }
      <span>{searchStr.slice(0,34)+'...'}</span>
      <span onClick={()=>setShowSearchDetails((prev)=>!prev)} className='text-blue-400 text-sm cursor-pointer'>View details</span>
    </div>
   }else{
    return searchStr
   }
 }

 const getExp = (str) =>{
  if(!str) return "NONE"
  if(str.toLowerCase().includes("year") || str.toLowerCase().includes("years")){
      return str
  }else{
      return `${str} Years`
  }
 }

 function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

  return (
    <div className='px-4 flex flex-col gap-6 pt-6 scroll-smooth '>
      {openScheduleJob && <ScheduleJob selectedCandidate={selectedCandidate} handleCloseSchedule={handleCloseScheduleJob}></ScheduleJob>}
      {openInviteBox && <SendInvite selectedCandidate={selectedCandidate} setSelectedCandidate={setSelectedCandidate} setOpenInviteBox={setOpenInviteBox} inviteType={inviteType}></SendInvite>}
      {openActivity && <Activity selectedCandidate={selectedCandidate} handleCloseActivity={handleCloseActivity}></Activity>}
      {openAllInviteBox && <SendAllInvite selectedCandidates={selectedCandidates} handleCloseAllInviteBox={handleCloseAllInviteBox}></SendAllInvite>}
       <div className='p-4 relative flex justify-between items-center bg-white w-full rounded-xl'>
         <div className='flex text-[16px] items-center gap-2'>
           <h1 className='text-lg text-[#111827]'><b>{searchResults.length}</b> profiles found for</h1>
           <span className='text-lg font-medium'>{location.state.searchType ==="manually" ? <span>{getSearchKeyword((keywords || []))}</span> : <span>{getSearchPrompt(payload.query)}</span>}</span>
         </div>
         <div className='flex items-center gap-2'>
           <span onClick={()=>navigate('/recruiter/searchcandidate', {state:location.state.searchType==="manually" ? "manually" : "ai"})} className='text-blue-400 text-[14px] font-semibold mr-2 cursor-pointer'>Modify Search</span>
           {/* Pagination Controls and Page Size Selector */}
           <div className="flex items-center gap-3 mr-4">
             {/* Page Size Selector */}
             <div className="flex items-center gap-1">
               <label htmlFor="pageSize" className="text-sm text-gray-600">Showing</label>
               <select
                 id="pageSize"
                 value={pageSize}
                 onChange={e => setPageSize(Number(e.target.value))}
                 className="border rounded px-2 py-1 text-sm focus:outline-none"
               >
                 {[60, 120, 240, 500].map(size => (
                   <option key={size} value={size}>{size}</option>
                 ))}
               </select>
               <label htmlFor='pageSize' className='text-sm text-gray-600'>per page</label>
             </div>
             {/* Pagination */}
             <div className="flex items-center gap-1">
               <button
                 className={`px-2 py-1 rounded border ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
               >
                 Prev
               </button>
               {Array.from({ length: totalPages }, (_, i) => (
                 <button
                   key={i + 1}
                   className={`px-2 py-1 rounded border ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                   onClick={() => handlePageChange(i + 1)}
                 >
                   {i + 1}
                 </button>
               ))}
               <button
                 className={`px-2 py-1 rounded border ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages || totalPages === 0}
               >
                 Next
               </button>
             </div>
           </div>
           <button disabled={selectedCandidates.length===0} className='p-1 px-2 bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md'>
             <span onClick={handleOpenAllInviteBox} className='text-white font-medium'>Send Invite</span>
           </button>
         </div>
       </div>
       <div className='grid grid-cols-6 gap-4 items-start'>
         <div className='col-span-1'>
         <FilterBox 
         selectedKeyword={selectedKeyword} 
         setSelectedKeyword={setSelectedKeyword} 
         selectedSkills={selectedSkills} 
         setSelectedSkills={setSelectedSkills}
         setMinExp={setMinExp}
         minExp={minExp}
         setMaxExp={setMaxExp}
         maxExp={maxExp}
         minSalary={minSalary}
         setMinSalary={setMinSalary}
         maxSalary={maxSalary}
         setMaxSalary={setMaxSalary}
         selectedCity={selectedCity}
         setSelectedCity={setSelectedCity}
         education={education}
         setEducation={setEducation}
         ></FilterBox>
         </div>

          {/* Candidate Result Section */}
          <div className='flex col-span-3 flex-col gap-4 max-h-screen hide-scrollbar overflow-y-auto'>
            {/* Candidate Search Result Header */}
            <div className='flex items-center justify-between'>
               <h1 className='font-bold text-2xl'>Search Results</h1>
               <div className='flex items-center gap-2'>
                 <button onClick={selectedCandidates.length === filterSearchResults.length ? handleDeselectAllCandidate :handleSelectAllCandidate} className='p-2 px-3 w-40 hover:bg-gray-100 bg-white transition-all duration-300 border-neutral-300 border rounded-md flex justify-center items-center gap-2'>
                   {
                    selectedCandidates.length === filterSearchResults.length ?
                    "Deselect All":
                    "Select All"
                   }
                 </button>
               <button onClick={handleSaveResult} className='p-2 px-3 w-40 hover:bg-gray-100 bg-white transition-all duration-300 border-neutral-300 border rounded-md flex justify-center items-center gap-2'>
                   {
                    loading ? 
                    <LoaderCircle className='animate-spin'></LoaderCircle>
                    :<div className='flex items-center gap-2'>
                      <Star size={16}></Star>
                    <span className='text-sm font-medium'>Save Search</span>
                    </div>
                   }
                 </button>
                 </div>
            </div>
            
            <div className='flex flex-col'>
               {/* Candidate result card */}
               {
                loader ? 
                  <div className='h-full flex justify-center items-center'>
                    <LoaderCircle className='animate-spin text-blue-500'></LoaderCircle>
                  </div>
                : filterSearchResults.length === 0 ? 
                   <div className='h-full flex justify-center items-center'>
                     <span className='text-gray-500'>No Search Results</span>
                   </div>
                : paginatedResults.map((item,index) => (
                  <div onClick={()=>{
                    setShowMobileNo(false)
                    setPreviewCandidate(item)}} 
                    key={index + (currentPage-1)*pageSize} 
                    className={`${item?._id === previewCandidate?._id ? "border-2 border-blue-500 bg-blue-50" : 'border hover:border-blue-400 border-neutral-300 bg-white'} 
                    ${index === 0 ? 'rounded-t-xl' : ''} 
                    ${index === paginatedResults.length - 1 ? 'rounded-b-xl' : ''} 
                    p-6 relative custom-shadow-1 flex items-start gap-4`}>
                    

                     <div className="absolute top-2 right-4 flex items-center justify-center">
                       {(() => {
                         const score = (location.state.searchType === 'manually' ? Number(item?.match_score) : Number(item?.relevance_score)) || 50;
                         const isLowScore = score < 50;
                         
                         if (isLowScore) {
                           // Circular design for scores < 50%
                           return (
                             <div className="relative w-14 h-14 flex items-center justify-center">
                               <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                                 <path
                                   d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"
                                   fill="none"
                                   stroke="#e5e7eb"
                                   strokeWidth="2"
                                 />
                                 <path
                                   d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"
                                   fill="none"
                                   stroke="#ef4444"
                                   strokeWidth="2"
                                   strokeDasharray={`${score}, 100`}
                                 />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-xs font-medium text-red-500">{score}%</span>
                               </div>
                             </div>
                           );
                         } else {
                           // Current design for scores >= 50%
                           return (
                             <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
                               <AutoAwesomeIcon style={{fontSize:'1.2rem'}} className='text-indigo-600'></AutoAwesomeIcon>
                               <span className='text-sm text-indigo-500'>{score}%</span>
                               <span className="text-sm font-medium bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                                 Matched
                               </span>
                             </div>
                           );
                         }
                       })()}
                     </div>

                   {/* CheckBox  */}
                   <input type='checkbox' checked={selectedCandidates.some((candidate) => candidate._id===item._id)} onClick={()=>handleSelectedCandidate(item)} className='absolute top-2 left-2 h-4 w-4'></input> 

                  <div className='w-24 h-20 bg-white rounded-full'>
                    <img src={PROFILE} className='w-full h-full'></img>
                  </div>
                  <div className='w-full flex flex-col gap-2.5'>
                    <div className='flex items-center gap-4'>
                      <h2 className='text-[18px] font-semibold'>{item?.contact_details?.name}</h2>
                      <div className='flex items-center gap-2'>
                      {isValidURL(item?.contact_details?.linkedin_profile) && <a href={item?.contact_details?.linkedin_profile} target='_blank'> <img src={LINK} className='w-6 h-6'></img></a>}
                      {isValidURL(item?.contact_details?.naukri_profile) && <a href={item?.contact_details?.naukri_profile} target='_blank'> <img src={N} className='w-6 h-6'></img></a>}
                      {isValidURL(item?.contact_details?.portfolio_link) && <a href={item?.contact_details?.portfolio_link} target='_blank'> <img src={WEB} className='w-5 h-5'></img></a>}
                      </div>
                    </div>
                    <div className='flex items-center mb-2 gap-6'>
                       <div className='flex items-center gap-2'>
                         <BriefcaseBusiness size={16} className='text-[#4b5563]'></BriefcaseBusiness>
                         <span className='text-[15px] text-[#4b5563]'>{getExp(item?.total_experience)}</span>
                       </div>
                       <div className='flex items-center'>
                           <span className='text-[#4b5563] text-[15px]'>₹</span>
                           <span className='text-[#4b5563] text-[15px]'>{item?.current_salary ? `${item.current_salary} LPA` : "NONE"}</span>
                       </div>
                       <div className='flex items-center gap-2'>
                         <MapPin size={17} className='text-[#4b5563]'></MapPin>
                         <span className=' text-[#4b5563] text-[15px]'>{item?.contact_details?.current_city}</span>
                       </div>
                    </div>
                    <div className='w-full flex flex-col items-start gap-2'>
                      <div className='flex col-span-3 items-center gap-2'>
                        <Mail size={16} className='text-[#4b5563]'></Mail>
                        <span className='text-[#4b5563] text-[15px]'>{item?.contact_details?.email}</span>
                      </div>
                      <div className='flex w-72 col-span-2 items-center gap-2'>
                        <Phone size={16} className='text-[#4b5563]'></Phone>
                        <span className='text-[#4b5563] text-[15px]'>{hideMobileNo(item?.contact_details?.phone)}</span>
                      </div>
                    </div>
                    <div className='w-full flex flex-col gap-2'>
                      <div className='flex items-start gap-2'>
                         <span className='text-[#6B7280] text-[14px]'>Pref Locations:</span>
                         <span className='text-[14px]'>
                          {item?.contact_details?.looking_for_jobs_in.map((val,index)=>(
                            <>
                            <span>{val}</span>
                            {index!==item?.contact_details?.looking_for_jobs_in.length-1 ? ", " : " "}
                            </>
                          ))}
                        </span>
                      </div>
                      {
                        item?.academic_details.length>0 && 
                        <div className='flex items-start gap-2'>
                          <span className='text-[#6B7280] text-[14px]'>Education:</span>
                          <span className={`text-[14px] ${item?.match_details?.matched_education.includes(item?.academic_details[0]?.education) && "bg-[#ffe991]"}`}>{item?.academic_details[0]?.education}</span>
                         </div>
                      }
                      <div className='flex items-center gap-2'>
                         <span className='text-[#6B7280] text-[14px]'>Pancard No:</span>
                         <span className='text-[14px]'>{item?.contact_details?.pan_card}</span>
                      </div>
                      <div className='flex flex-col gap-1'>
                         <span className='text-[#6B7280] text-[14px]'>Skills:</span>
                         {
                           handleGetSkills(item?.skills, item?.match_details?.matched_skills)
                         }
                      </div>
                    </div>
                  </div>
                  <div className='mt-8 flex w-12 flex-col gap-1'>
                     <button onClick={()=>handleOpenInviteBox(item, 'whatsapp')} className='bg-green-500 mt-2 flex justify-center items-center rounded-md text-white p-1.5'>
                         <img src={Watsapp} className='w-6 h-6 invert'></img>
                     </button>
                     <button onClick={()=>handleOpenInviteBox(item, 'mail')} className='bg-blue-600 mt-2 flex justify-center items-center rounded-md text-white p-1.5'>
                         <img src={EMail} className='w-6 h-6 invert'></img>
                     </button>
                     
                  </div>
              </div>
                ))
               }
            </div>
          </div>

          {/* Candidate Preview Box  */}
          <div className='sticky col-span-2 top-4 max-h-[calc(100vh-32px)] overflow-y-auto self-start bg-white border flex flex-col gap-6 border-neutral-300 p-6 rounded-xl custom-shadow-1'>
              <div className='flex flex-col gap-2'>
                <div className='flex justify-between items-center'>
                 <h1 className='text-xl font-semibold'>Candidate Details</h1>

                 <button className='text-white p-1.5 bg-blue-500 rounded-md  flex items-center gap-2' onClick={() => navigate('/recruiter/editcandidate', { state: { candidate: previewCandidate } })}>
                   <SquarePen size={18}></SquarePen>
                 </button>
                 
                 </div>
                 <div className='flex items-center gap-2'>
                   <div className='flex items-center gap-2'>
                      <UserRound size={16} className='text-neutral-500'></UserRound>
                      <span className='text-sm text-neutral-500'>Recruiter:</span>
                   </div>
                   <span className='text-sm text-neutral-500'>{previewCandidate?.username}</span>
                 </div>
              </div>
              <div className='overflow-scroll h-[600px]'>
                <div className='flex flex-col gap-4 pb-6 border-b border-neutral-300'>
                   <div className='flex items-center gap-4'>
                     <div className='w-20 h-20 bg-white rounded-full'>
                       <img src={PROFILE} alt='profile' className='w-full h-full'></img>
                     </div>
                     <div className='flex flex-col'>
                       <h1 className='text-lg font-semibold'>{previewCandidate?.contact_details?.name}</h1>
                       <span className='text-gray-400 text-[16px]'>{getExp(previewCandidate?.total_experience)==="NONE" ? "NONE" : `${getExp(previewCandidate?.total_experience)} Experience`} </span>
                     </div>
                   </div>
                   <div className='flex items-center gap-2'>
                     <button className='flex-1 p-1.5 hover:bg-blue-400 hover:shadow-lg transition-all duration-300 rounded-md text-white font-medium bg-blue-500'>
                       Resume
                     </button>
                     <button onClick={()=>handleOpenScheduleJob(previewCandidate)} className='flex-1 p-1.5 bg-teal-400 hover:bg-teal-500 hover:shadow-lg transition-all duration-300 rounded-md text-white font-medium'>
                       Reminder
                     </button>
                     <button onClick={handleOpenActivity} className='flex-1 p-1.5 bg-amber-400 hover:bg-amber-500 hover:shadow-lg transition-all duration-300 rounded-md text-white font-medium'>
                       Activity
                     </button>
                   </div>
                </div>
                <div className='border-b w-full border-neutral-300 grid grid-cols-2 gap-y-6 py-6 items-center gap-4'>
                  <div className='flex flex-col gap-0.5'>
                     <span className='text-base text-[#6a7280]'>Current Salary</span>
                     <h1 className='text-[16px] font-semibold'> {previewCandidate?.current_salary ? `₹${Number(previewCandidate?.current_salary)} LPA` : "NONE" }</h1>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                     <span className='text-base text-[#6a7280]'>Current City</span>
                     <h1 className='text-[16px] font-semibold'>{previewCandidate?.contact_details?.current_city}</h1>
                  </div>
                  <div className='flex col-span-2 w-full flex-col gap-4'>
                     <div className='flex w-full justify-between items-center'>
                       <div className='flex flex-col gap-0.5'>
                         <span className='text-sm text-[#6a7280]'>Email</span>
                         <span className='text-sm'>{previewCandidate?.contact_details?.email}</span>
                       </div>
                       <button className='cursor-pointer' onClick={()=>handleCopy(previewCandidate?.contact_details?.email)}>
                           <Copy size={18} className='text-gray-900'></Copy>
                       </button>
                     </div>
                     <div className='flex justify-between items-center'>
                       <div className='flex flex-col gap-0.5'>
                         <span className='text-sm text-[#6a7280]'>Mobile</span>
                         <span className='text-sm'>{showMobileNo ?  previewCandidate?.contact_details?.phone : hideMobileNo(previewCandidate?.contact_details?.phone)}</span>
                       </div>  
                           {
                            showMobileNo ? 
                            <button className='cursor-pointer' onClick={()=>handleCopy(previewCandidate?.contact_details?.phone)}>
                            <Copy size={18} className='text-gray-900'></Copy>
                            </button>
                            :<button onClick={handleViewMobileNo} className='p-1 border text-white rounded-md text-sm px-2 font-medium bg-green-500'>
                              View
                            </button>
                           }
                     </div>
                   </div>
                  <div className='col-span-2 flex flex-col gap-0.5'>
                     <span className='text-sm text-[#6a7280]'>Prefered Locations</span>
                     <span>
                          {previewCandidate?.contact_details?.looking_for_jobs_in.map((val,index)=>(
                            <>
                            <span>{val}</span>
                            {index!==previewCandidate?.contact_details?.looking_for_jobs_in.length-1 ? ", " : " "}
                            </>
                          ))}
                     </span>
                  </div>
                  <div className='col-span-2 flex flex-col gap-0.5'>
                     <span className='text-sm text-[rgb(106,114,128)]'>Pancard</span>
                     <span>{previewCandidate?.contact_details?.pan_card}</span>
                  </div>
                </div>

                <div className='w-full border-b border-neutral-300 flex py-6 flex-col gap-3'>
                    <div className='flex items-center gap-2'>
                      <BriefcaseBusiness size={20}></BriefcaseBusiness>
                      <span className='text-lg font-medium'>Experience</span>
                    </div>
                    <div className='flex flex-col gap-4'>
                      {
                        (previewCandidate?.experience || []).map((item,index)=>(
                        <div key={index} className='border-l-2 border-blue-300 flex flex-col gap-2 px-4'>
                          <h1 className='text-lg font-medium'>{item?.title}</h1>
                          <div className='flex flex-col gap-1'>
                            <span className='text-blue-400'>{item?.company}</span>
                            <div className='flex items-center gap-2'>
                               <Calendar size={16}></Calendar>
                               <span className='text-gray-400'>{formatDateToMonthYear(item?.from_date)} - {formatDateToMonthYear(item?.until)}</span>
                            </div>
                          </div>
                        </div>
                        ))
                      }
                    </div>
                </div>

                <div className='w-full border-b border-neutral-300 flex py-6 flex-col gap-3'>
                   <div className='flex items-center gap-2'>
                      <GraduationCap size={20}></GraduationCap>
                      <span className='text-lg font-medium'>Academic Details</span>
                    </div>
                    <div className='flex flex-col gap-4'>
                    {
                      previewCandidate?.academic_details?.map((item,index) => (
                        <div key={index} className='border-l-2 border-green-300 flex flex-col gap-2 px-4'>
                        <h1 className='text-lg font-medium'>{item?.education}</h1>
                        <div className='flex flex-col gap-1'>
                          <span className='text-green-500'>{item?.college}</span>
                          <div className='flex items-center gap-2'>
                             <Calendar size={16}></Calendar>
                             <span className='text-gray-400'>Graduated - {item?.pass_year}</span>
                          </div>
                         </div>
                        </div>
                      ))
                    }
                    </div>
                </div>

                <div className='flex flex-col gap-4 py-6'>
                   <h1 className='text-lg font-medium'>Skills</h1>
                   <div className='flex flex-wrap items-center gap-2'>
                       {
                        previewCandidate?.skills?.map((item,index) => (
                          <span key={index} className={`text-[13px] py-0.5 px-2 rounded-xl ${previewCandidate?.match_details?.matched_skills.includes(item) ? 'bg-[#ffe991]' : 'bg-gray-200'}`}>
                            {item}
                          </span>
                        ))
                       }
                   </div>
                </div>

                <div className='flex flex-col gap-4 py-6'>
                  <h1 className='text-lg font-medium'>Other Details</h1>
                  <div className='flex flex-col gap-3'>
                     <div className='flex items-center justify-between'>
                       <span className='text-[#6a7280]'>Naukri Profile:</span>
                       {
                        isValidURL(previewCandidate?.contact_details?.naukri_profile) ? 
                        <a href={previewCandidate?.contact_details?.naukri_profile} target='_blank' className='flex items-center gap-1 text-sm text-blue-500'>
                          View Profile
                          <ExternalLink size={16}></ExternalLink>
                        </a>
                        :
                        <button className='flex items-center cursor-not-allowed gap-1 text-sm text-gray-400' disabled>
                        View Profile
                        <ExternalLink size={16}></ExternalLink>
                        </button>
                       }

                     </div>
                     <div className='flex items-center justify-between'>
                       <span className='text-[#6a7280]'>Portfolio:</span>
                       {
                        isValidURL(previewCandidate?.contact_details?.portfolio_link) ? 
                          <a href={previewCandidate?.contact_details?.portfolio_link} target='_blank' className='flex items-center gap-1 text-sm text-blue-500'>
                            View Profile
                            <ExternalLink size={16}></ExternalLink>
                          </a>
                        :
                        <button className='flex items-center cursor-not-allowed gap-1 text-sm text-gray-400' disabled>
                            View Profile
                            <ExternalLink size={16}></ExternalLink>
                        </button>
                       }
                      
                     </div>
                     <div className='flex items-center justify-between'>
                       <span className='text-[#6a7280]'>Linkedin Profile:</span>
                       {
                        isValidURL(previewCandidate?.contact_details?.linkedin_profile) ?
                          <a href={previewCandidate?.contact_details?.linkedin_profile} target='_blank' className='flex items-center gap-1 text-sm text-blue-500'>
                            View Profile
                            <ExternalLink size={16}></ExternalLink>
                          </a>
                        :
                         <button className='flex items-center cursor-not-allowed gap-1 text-sm text-gray-400' disabled>
                            View Profile
                            <ExternalLink size={16}></ExternalLink>
                          </button>
                       }

                     </div>
                     <div className='flex items-center justify-between'>
                       <span className='text-[#6a7280]'>Adharcard:</span>
                       <span className='text-sm'>{previewCandidate?.contact_details?.aadhar_card}</span>
                     </div>
                     <div className='flex flex-col gap-2'>
                       <span className='text-[#6a7280]'>Exit Reason:</span>
                       <div className='p-1 bg-gray-100'>
                          <p className='text-sm'>{previewCandidate?.exit_reason}</p>
                       </div>
                     </div>
                     <div className='flex flex-col gap-2'>
                       <span className='text-[#6a7280]'>Comment:</span>
                       <div className='p-1 bg-gray-100'>
                          <p className='text-sm'>{previewCandidate?.comment}</p>
                       </div>
                     </div>
                     <div className='flex justify-between items-center'>
                       <span>Source:</span>
                       <span className='p-1 text-sm border border-neutral-400 font-semibold'>{previewCandidate?.source}</span>
                     </div>
                  </div>
                </div>

              </div>
          </div>
          </div>
    </div>
  )
}

export default CandidateResult