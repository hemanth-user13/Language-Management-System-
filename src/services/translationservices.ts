import axios from "axios";

export const getLanguageData = () => {
  return axios.get(
    "https://translation-manager-be.onrender.com/translations/"
  );
}

export const deleteLanguageData=()=>{
    return axios.delete('https://translation-manager-be.onrender.com/translations')
}