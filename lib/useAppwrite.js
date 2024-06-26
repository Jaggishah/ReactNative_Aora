import { useEffect, useState } from "react";

const useAppwrite = (fn) => {
    const [ data , setData ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(true);
  
    const fetchData = async () => {
      setIsLoading(true);
      try{
        const response = await fn();
        setData(response);
      }catch(err){
        Alert.alert
        ('Error',err.message)
      }finally{
        setIsLoading(false);
      }
    }

    useEffect(() => {
  
      fetchData();
    },[])

    const refetch = () => fetchData();

    return { data, refetch };
}

export default useAppwrite;