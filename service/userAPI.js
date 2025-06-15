// services/userAPI.js
import axios from "axios";

const userAPI = axios.create({
  baseURL: "http://localhost:5000/user",
  timeout: 3000,
});

export default userAPI;
