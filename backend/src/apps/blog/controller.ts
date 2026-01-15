import { Request, Response } from "express"
import { blogService } from "./service.js"
import { logger } from "../../lib/logger.js"
import type { CreatePostInput, UpdatePostInput, CreateCommentInput } from "./types.js"

export const blogController = {
  /**
   * Get all posts (feed)
   */
  getAllPosts: async (req: Request, res: Response) => {
    try {
      const posts = await blogService.getAllPosts()
      res.json(posts)
    } catch (error) {
      logger.error({ error }, "Failed to get posts")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get posts",
      })
    }
  },

  /**
   * Get post by ID
   */
  getPostById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const post = await blogService.getPostById(id)

      if (!post) {
        return res.status(404).json({ error: "Post not found" })
      }

      res.json(post)
    } catch (error) {
      logger.error({ error }, "Failed to get post")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get post",
      })
    }
  },

  /**
   * Create a new post
   */
  createPost: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId
      
      // Log raw body if available for debugging
      if ((req as any).rawBody) {
        logger.info({ rawBody: (req as any).rawBody }, "Raw request body")
      }
      
      const input: CreatePostInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      if (!input.title || !input.title.trim() || !input.content || !input.content.trim()) {
        return res.status(400).json({ error: "Title and content are required and cannot be empty" })
      }

      logger.info({ userId, input: { ...input, imageUrl: input.imageUrl ? "[present]" : "[absent]" } }, "Creating post")
      const post = await blogService.createPost(userId, input)
      res.status(201).json(post)
    } catch (error: any) {
      logger.error({ 
        error: error?.message || error,
        errorName: error?.name,
        errorCode: error?.code,
        errorMeta: error?.meta,
        stack: error?.stack,
        input: req.body,
        userId: req.user?.userId
      }, "Failed to create post")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create post",
      })
    }
  },

  /**
   * Update a post
   */
  updatePost: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = req.user?.userId
      const input: UpdatePostInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      const post = await blogService.updatePost(id, userId, input)
      res.json(post)
    } catch (error) {
      logger.error({ error }, "Failed to update post")
      if (error instanceof Error && error.message === "Post not found") {
        return res.status(404).json({ error: "Post not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update post",
      })
    }
  },

  /**
   * Delete a post
   */
  deletePost: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      await blogService.deletePost(id, userId)
      res.json({ message: "Post deleted successfully" })
    } catch (error) {
      logger.error({ error }, "Failed to delete post")
      if (error instanceof Error && error.message === "Post not found") {
        return res.status(404).json({ error: "Post not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete post",
      })
    }
  },

  /**
   * Add a comment to a post
   */
  addComment: async (req: Request, res: Response) => {
    try {
      const { postId } = req.params
      const userId = req.user?.userId
      const input: CreateCommentInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      if (!input.content) {
        return res.status(400).json({ error: "Comment content is required" })
      }

      const comment = await blogService.addComment(postId, userId, input)
      res.status(201).json(comment)
    } catch (error) {
      logger.error({ error }, "Failed to add comment")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to add comment",
      })
    }
  },

  /**
   * Delete a comment
   */
  deleteComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      await blogService.deleteComment(id, userId)
      res.json({ message: "Comment deleted successfully" })
    } catch (error) {
      logger.error({ error }, "Failed to delete comment")
      if (error instanceof Error && error.message === "Comment not found") {
        return res.status(404).json({ error: "Comment not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete comment",
      })
    }
  },

  /**
   * Toggle like on a post
   */
  toggleLike: async (req: Request, res: Response) => {
    try {
      const { postId } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      const result = await blogService.toggleLike(postId, userId)
      res.json(result)
    } catch (error) {
      logger.error({ error }, "Failed to toggle like")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to toggle like",
      })
    }
  },
}
