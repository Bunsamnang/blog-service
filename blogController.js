import blogModel from "./blogModel.js";
import { isValidObjectId } from "mongoose";
import userAPI from "./service/userAPI.js";

// ----------------- USER SERVICE --------------------
export const viewAll = async (req, res) => {
  console.log("[Blog Service] Incoming Headers:", req.headers);

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await blogModel
      .find({ isPublished: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-_id -isPublished")
      .lean();

    const enrichedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        try {
          const userRes = await userAPI.get(`/${blog.author}`);
          const user = userRes.data;
          console.log(user);

          return {
            ...blog,
            author: {
              username: user.username,
              email: user.email,
            },
          };
        } catch (err) {
          console.error(`Failed to fetch author for blog`, err.message);
          return {
            ...blog,
            author: null,
          };
        }
      })
    );

    const total = await blogModel.countDocuments({ isPublished: true });

    res.status(200).json({
      message: "Retrived successfully",
      blogs: enrichedBlogs,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    console.error("Error fetching public blogs:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Private: View logged-in user's own blogs with pagination
export const viewOwnBlogs = async (req, res) => {
  try {
    const user_id = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await blogModel
      .find({ author: user_id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await blogModel.countDocuments({ author: user_id });

    res.status(200).json({
      message: "Retrived successfully",
      blogs,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    console.error("Error fetching user blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, content, isPublished } = req.body;

    const user_id = req.user._id;

    if (!title || !content) {
      res.status(400).json({ message: "Title and content required" });
    }

    const newBlog = await blogModel.create({
      title,
      content,
      isPublished,
      author: user_id,
    });

    res.status(200).json({ message: "Created successfully", data: newBlog });
  } catch (err) {
    console.error("Error fetching user blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const editBlog = async (req, res) => {
  try {
    const { id: blog_id } = req.params;
    const user_id = req.user._id;

    console.log("User id: ", user_id);
    // check if blog id is valid id
    if (!isValidObjectId(blog_id)) {
      res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await blogModel.findById(blog_id).exec();

    // check if blog exist
    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
    }

    console.log("Author: ", blog.author);

    // Check if user is the author
    if (blog.author.toString() !== user_id.toString()) {
      res.status(401).json({ message: "Not authorized to edit this blog" });
    }

    const { title, content, isPublished } = req.body;

    if (!title && !content && !isPublished) {
      return res.status(400).json({
        message:
          "Bruh... you gotta send *something* to update 😭 (title, content, or isPublished)",
      });
    }

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (isPublished) blog.isPublished = isPublished;

    const updatedBlog = await blog.save();

    res.status(200).json({
      message: "Updated successfully",
      data: updatedBlog,
    });
  } catch (err) {
    console.error("Error fetching user blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id: blog_id } = req.params;
    const user_id = req.user._id;

    // Validate ID
    if (!isValidObjectId(blog_id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    // Check if blog exists first (don’t delete yet!)
    const blog = await blogModel.findById(blog_id).exec();

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check author
    if (blog.author.toString() !== user_id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this blog" });
    }

    // Now delete
    await blog.deleteOne();

    res.status(200).json({ message: "Blog deleted successfully", data: blog });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------- ADMIN ---------------------

// Admin: View all blogs (published + drafts) with _id and author
export const adminViewAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await blogModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // keep _id and all fields

    const enrichedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        try {
          const userRes = await userAPI.get(`/${blog.author}`);
          const user = userRes.data;

          return {
            ...blog,
            authorInfo: {
              id: blog.author, // keep original ObjectId
              username: user.username,
              email: user.email,
            },
          };
        } catch (err) {
          console.error(`Failed to fetch author for blog`, err.message);
          return {
            ...blog,
            authorInfo: null,
          };
        }
      })
    );

    const total = await blogModel.countDocuments();

    res.status(200).json({
      message: "Admin: Retrieved all blogs",
      blogs: enrichedBlogs,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    console.error("Admin error fetching blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: View specific user's blogs
export const adminViewUserBlogs = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const blogs = await blogModel
      .find({ author: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: `Retrieved blogs for user ${userId}`,
      blogs,
    });
  } catch (err) {
    console.error("Admin error fetching user blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Delete any blog
export const adminDeleteBlog = async (req, res) => {
  try {
    const { id: blogId } = req.params;

    if (!isValidObjectId(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await blogModel.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.deleteOne();

    res.status(200).json({ message: "Admin deleted blog", data: blog });
  } catch (err) {
    console.error("Admin error deleting blog:", err);
    res.status(500).json({ message: "Server error" });
  }
};
