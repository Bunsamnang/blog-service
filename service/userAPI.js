// services/userAPI.js
import axios from "axios";

const userAPI = axios.create({
  baseURL: "http://54.89.139.190:5000/user",
  timeout: 3000,
});

export default userAPI;
