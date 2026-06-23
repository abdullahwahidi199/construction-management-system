import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    delete instance.defaults.headers.common.Authorization;
  }
};

const storedToken = localStorage.getItem("cms.auth.token");
if (storedToken) {
  setAuthToken(storedToken);
}

export default instance;
