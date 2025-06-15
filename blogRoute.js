import express from "express";
import {
  adminDeleteBlog,
  adminViewAllBlogs,
  adminViewUserBlogs,
  createBlog,
  deleteBlog,
  editBlog,
  viewAll,
  viewOwnBlogs,
} from "./blogController.js";
import { extractUserFromHeader } from "./middleware/extractFromHeader.js";
import { verifyAdmin } from "./middleware/verifyAdmin.js";
const router = express.Router();

router.get("/public/viewall", viewAll);
router.get("/user/myblogs", extractUserFromHeader, viewOwnBlogs);

router.post("/user/create-blog", extractUserFromHeader, createBlog);
router.put("/user/edit-blog/:id", extractUserFromHeader, editBlog);
router.delete("/user/delete-blog/:id", extractUserFromHeader, deleteBlog);

router.get("/admin/blogs", verifyAdmin, adminViewAllBlogs);
router.get("/admin/blogs/:userId", verifyAdmin, adminViewUserBlogs);
router.delete("/admin/blogs/:id", verifyAdmin, adminDeleteBlog);

export default router;
