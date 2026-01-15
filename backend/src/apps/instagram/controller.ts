import { Request, Response } from "express"
import { instagramService } from "./service.js"
import { logger } from "../../lib/logger.js"
import type {
  CreateInstagramPostInput,
  UpdateInstagramPostInput,
  CreateInstagramCommentInput,
} from "./types.js"

export const instagramController = {
  /**
   * Get all Instagram posts (feed)
   */
  getAllPosts: async (req: Request, res: Response) => {
    try {
      const posts = await instagramService.getAllPosts()
      res.json(posts)
    } catch (error) {
      logger.error({ error }, "Failed to get Instagram posts")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get Instagram posts",
      })
    }
  },

  /**
   * Get posts by user ID
   */
  getPostsByUserId: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params
      const posts = await instagramService.getPostsByUserId(userId)
      res.json(posts)
    } catch (error) {
      logger.error({ error }, "Failed to get user Instagram posts")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get user Instagram posts",
      })
    }
  },

  /**
   * Get post by ID
   */
  getPostById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const post = await instagramService.getPostById(id)

      if (!post) {
        return res.status(404).json({ error: "Post not found" })
      }

      res.json(post)
    } catch (error) {
      logger.error({ error }, "Failed to get Instagram post")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get Instagram post",
      })
    }
  },

  /**
   * Create a new Instagram post
   */
  createPost: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId
      const input: CreateInstagramPostInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      if (!input.imageUrl || !input.imageUrl.trim()) {
        return res.status(400).json({ error: "Image URL is required" })
      }

      logger.info({ userId, input }, "Creating Instagram post")
      const post = await instagramService.createPost(userId, input)
      res.status(201).json(post)
    } catch (error: any) {
      logger.error({
        error: error?.message || error,
        errorName: error?.name,
        errorCode: error?.code,
        errorMeta: error?.meta,
        stack: error?.stack,
        input: req.body,
        userId: req.user?.userId,
      }, "Failed to create Instagram post")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create Instagram post",
      })
    }
  },

  /**
   * Update an Instagram post
   */
  updatePost: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = req.user?.userId
      const input: UpdateInstagramPostInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      const post = await instagramService.updatePost(id, userId, input)
      res.json(post)
    } catch (error) {
      logger.error({ error }, "Failed to update Instagram post")
      if (error instanceof Error && error.message === "Post not found") {
        return res.status(404).json({ error: "Post not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update Instagram post",
      })
    }
  },

  /**
   * Delete an Instagram post
   */
  deletePost: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      await instagramService.deletePost(id, userId)
      res.json({ message: "Post deleted successfully" })
    } catch (error) {
      logger.error({ error }, "Failed to delete Instagram post")
      if (error instanceof Error && error.message === "Post not found") {
        return res.status(404).json({ error: "Post not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete Instagram post",
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
      const input: CreateInstagramCommentInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      if (!input.content || !input.content.trim()) {
        return res.status(400).json({ error: "Comment content is required" })
      }

      const comment = await instagramService.addComment(postId, userId, input)
      res.status(201).json(comment)
    } catch (error) {
      logger.error({ error }, "Failed to add Instagram comment")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to add Instagram comment",
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

      await instagramService.deleteComment(id, userId)
      res.json({ message: "Comment deleted successfully" })
    } catch (error) {
      logger.error({ error }, "Failed to delete Instagram comment")
      if (error instanceof Error && error.message === "Comment not found") {
        return res.status(404).json({ error: "Comment not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete Instagram comment",
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

      const result = await instagramService.toggleLike(postId, userId)
      res.json(result)
    } catch (error) {
      logger.error({ error }, "Failed to toggle Instagram like")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to toggle Instagram like",
      })
    }
  },
}
