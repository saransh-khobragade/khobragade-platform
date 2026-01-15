import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import type {
  Post,
  Comment,
  Like,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
} from "./types.js"

export const blogService = {
  /**
   * Get all posts (feed)
   */
  getAllPosts: async (): Promise<Post[]> => {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return posts as Post[]
  },

  /**
   * Get post by ID
   */
  getPostById: async (postId: string): Promise<Post | null> => {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    return post as Post | null
  },

  /**
   * Create a new post
   */
  createPost: async (authorId: string, input: CreatePostInput): Promise<Post> => {
    try {
      const postData: any = {
        title: input.title.trim(),
        content: input.content.trim(),
        authorId,
      }
      
      // Only include imageUrl if it's provided and not empty
      if (input.imageUrl && input.imageUrl.trim() !== "") {
        postData.imageUrl = input.imageUrl.trim()
      }
      
      logger.info({ authorId, postData }, "Attempting to create post")
      
      const post = await prisma.post.create({
        data: postData,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      })

      logger.info({ postId: post.id, authorId }, "Post created")
      return post as Post
    } catch (error: any) {
      logger.error({ 
        error: error.message, 
        code: error.code, 
        meta: error.meta,
        authorId,
        input 
      }, "Prisma error creating post")
      throw error
    }
  },

  /**
   * Update a post
   */
  updatePost: async (
    postId: string,
    authorId: string,
    input: UpdatePostInput
  ): Promise<Post> => {
    // Verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      throw new Error("Post not found")
    }

    if (existingPost.authorId !== authorId) {
      throw new Error("Not authorized to update this post")
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(input.title && input.title.trim() && { title: input.title.trim() }),
        ...(input.content && input.content.trim() && { content: input.content.trim() }),
        ...(input.imageUrl !== undefined && {
          imageUrl: input.imageUrl && input.imageUrl.trim() !== "" ? input.imageUrl.trim() : null,
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    logger.info({ postId, authorId }, "Post updated")
    return post as Post
  },

  /**
   * Delete a post
   */
  deletePost: async (postId: string, authorId: string): Promise<void> => {
    // Verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      throw new Error("Post not found")
    }

    if (existingPost.authorId !== authorId) {
      throw new Error("Not authorized to delete this post")
    }

    await prisma.post.delete({
      where: { id: postId },
    })

    logger.info({ postId, authorId }, "Post deleted")
  },

  /**
   * Add a comment to a post
   */
  addComment: async (
    postId: string,
    authorId: string,
    input: CreateCommentInput
  ): Promise<Comment> => {
    const comment = await prisma.comment.create({
      data: {
        content: input.content,
        postId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    logger.info({ commentId: comment.id, postId, authorId }, "Comment added")
    return comment as Comment
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string, authorId: string): Promise<void> => {
    // Verify ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      throw new Error("Comment not found")
    }

    if (existingComment.authorId !== authorId) {
      throw new Error("Not authorized to delete this comment")
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    logger.info({ commentId, authorId }, "Comment deleted")
  },

  /**
   * Toggle like on a post
   */
  toggleLike: async (postId: string, userId: string): Promise<{ liked: boolean }> => {
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      logger.info({ postId, userId }, "Post unliked")
      return { liked: false }
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      })
      logger.info({ postId, userId }, "Post liked")
      return { liked: true }
    }
  },

  /**
   * Check if user has liked a post
   */
  hasUserLiked: async (postId: string, userId: string): Promise<boolean> => {
    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    return !!like
  },
}
