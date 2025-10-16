import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

//Importing icons
import { TextSearch } from 'lucide-react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import AiSearch from '../../components/database/AiSearch';
import AiRecentSearch from '../../components/database/AiRecentSearch';
import ManuallSearch from '../../components/database/ManuallSearch';
import Loading from '../../components/database/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';


function SearchCandidate() {
  const location = useLocation()
  const navigate = useNavigate()
  const {user} = useContext(AuthContext)


  const [activeTab,setActiveTab] = useState(location.state || 'manually')

  //For recent search
  const [PromptRecentSearch,setPromptRecentSearch] = useState([])
  const [manuallRecentSearch,setManuallRecentSearch] = useState([])

  //For saved search
  const [PromptSavedSearch,setPromptSavedSearch] = useState([])
  const [manuallSavedSearch,setManuallSavedSearch] = useState([])

  //For filled recent search
  const [manuallRecentFilledSearch,setManuallRecentFilledSearch] = useState({})
  const [promptRecentFilledSearch,setPromptRecentFilledSearch] = useState('')

  const [loader,setLoader] = useState(false)

  const handleManuallSearchCandidate = async (experience_titles,skills, min_experience, max_experience, min_education,locations,min_salary,max_salary) =>{
    let payload = {
      userid:user._id,
       experience_titles,
       skills,
       min_experience,
       max_experience,
       min_education,
       locations,
       min_salary,
       max_salary
    }
    try{
       setLoader(true)
       const response = await axios.post(`${process.env.REACT_APP_AI_URL}/manualsearch`,payload)
       await axios.post(`${process.env.REACT_APP_AI_URL}/manual_saved_recnet_search/save_recent_search`,{
        userid:user._id,
        ...payload
       })
      console.log('result data----->',response.data)
      if(!response || !response.data || response.data.length === 0){
        toast.error("There is no search results for given keywords.")
      } else{
        navigate('/recruiter/searchresult',{state:{candidate_result:response.data,payload,searchType:'manually'}})
      }
      
    }catch(err){
      console.log(err)
    }finally{
      setLoader(false)
    }
  }

  const handlePromptBaseSearch = async (prompt) =>{
    try{ 
      setLoader(true)
      const response = await axios.post(`${process.env.REACT_APP_AI_URL}/rag/llm-context-search`,{
          user_id:user._id,
          query:prompt,
          context_size:10,
          relevant_score:40
      })
      //Saved recent search
      await axios.post(`${process.env.REACT_APP_AI_URL}/ai_search_operations/save_recent_search`,{
        user_id:user._id,
        query:prompt
      })
      console.log('response data----->',response)
      if(!response || !response.data || !response.data.results || response.data.results.length === 0){
        toast.error("There is no search results for given keywords.")
      }else{
        navigate('/recruiter/searchresult',{state:{candidate_result:response.data.results,payload:{query:prompt},searchType:'prompt'}})
      }
      
    }catch(err){
      console.log(err)
    }finally{
      setLoader(false)
    }
  }


  const handleGetAiRecentSearch = async () =>{
    try{
      const promptRecentSearch = await axios.get(`${process.env.REACT_APP_AI_URL}/ai_search_operations/recent_searches/${user._id}`)
      setPromptRecentSearch(promptRecentSearch.data.searches.map((item)=>item.query))
    }catch(err){
      console.log(err)
    }
  }


  const handleGetManuallRecentSearch = async () =>{
    try{
      const manuallRecentSearch = await axios.get(`${process.env.REACT_APP_AI_URL}/manual_saved_recnet_search/recent_searches/${user._id}`)
      setManuallRecentSearch(manuallRecentSearch.data.searches.map((item) => item.search_criteria))
    }catch(err){
      console.log(err)
    }
  }

  const handleGetManuallSavedSearch = async ()=>{
    try{
      const manuallSavedSearch = await axios.get(`${process.env.REACT_APP_AI_URL}/manual_saved_recnet_search/saved_searches/${user._id}`)
      setManuallSavedSearch(manuallSavedSearch.data.searches.map(item => item.search_criteria))
    }catch(err){
      console.log(err)
    }
  }

  const handleGetPromptSavedSearch = async ()=>{
     try{
       const promptSavedSearch = await axios.get(`${process.env.REACT_APP_AI_URL}/ai_search_operations/saved_searches/${user._id}`)
       setPromptSavedSearch(promptSavedSearch.data.searches.map((item)=>item.query))
     }catch(err){
      console.log(err)
     }
  }

  useEffect(()=>{
      handleGetAiRecentSearch()
      handleGetManuallRecentSearch()
      handleGetManuallSavedSearch()
      handleGetPromptSavedSearch()
  },[])

  return (
    <div className='px-7 pt-7 flex flex-col gap-4'>
        <div className=''>
            <h1 className='text-3xl tracking-wide text-blue-600 font-bold'>Search Candidates</h1>
        </div>
        <div className='flex w-full h-full gap-4 items-start'>
             <div className='w-4/6 flex flex-col gap-4'>
                <div className='bg-white p-1.5 overflow-hidden relative rounded-md'>
                    <div className='relative grid grid-cols-2 items-center'>
                    <div
                     className={`absolute top-0 h-full left-0 bottom-2 border border-neutral-300 w-1/2 bg-gray-400/20 rounded-md transition-all duration-300 ease-in-out z-0`}
                     style={{
                       transform: activeTab === 'ai' ? 'translateX(100%)' : 'translateX(0%)'
                     }}
                    />
                    <button onClick={()=>setActiveTab("manually")} className='relative z-10 flex rounded-l-md p-2 justify-center items-center gap-2.5'>
                       <TextSearch></TextSearch>
                       <span className='font-medium'>Search Manually</span>
                    </button>
                    <button onClick={()=>setActiveTab("ai")} className={`relative z-10 flex rounded-r-md p-2 justify-center items-center gap-2.5`}>
                       <AutoAwesomeIcon></AutoAwesomeIcon>
                       <span className='font-medium'>UpGenie</span>
                    </button>
                    </div>
                </div>
                { 
                  loader?
                  <Loading></Loading>
                  :(activeTab==="manually"?
                  <ManuallSearch manuallRecentFilledSearch={manuallRecentFilledSearch} handleManuallSearchCandidate={handleManuallSearchCandidate}></ManuallSearch>
                  :<AiSearch promptRecentFilledSearch={promptRecentFilledSearch} handlePromptBaseSearch={handlePromptBaseSearch}></AiSearch>)
                }       
             </div>
             <div className='w-4/12 flex flex-col gap-4'>
               <AiRecentSearch searchType={activeTab} setPromptRecentFilledSearch={setPromptRecentFilledSearch} setManuallRecentFilledSearch={setManuallRecentFilledSearch} dataType={"save"} data={activeTab==="manually"?manuallSavedSearch:PromptSavedSearch} ></AiRecentSearch>
               <AiRecentSearch searchType={activeTab} setPromptRecentFilledSearch={setPromptRecentFilledSearch} setManuallRecentFilledSearch={setManuallRecentFilledSearch} dataType={"recent"} data={activeTab==="manually"?manuallRecentSearch:PromptRecentSearch}></AiRecentSearch>
             </div>
        </div>
    </div>
  )
}

export default SearchCandidate