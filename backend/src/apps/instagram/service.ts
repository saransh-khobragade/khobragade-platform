import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import type {
  InstagramPost,
  InstagramComment,
  InstagramLike,
  CreateInstagramPostInput,
  UpdateInstagramPostInput,
  CreateInstagramCommentInput,
} from "./types.js"

export const instagramService = {
  /**
   * Get all Instagram posts (feed)
   */
  getAllPosts: async (): Promise<InstagramPost[]> => {
    const posts = await prisma.instagramPost.findMany({
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

    return posts as InstagramPost[]
  },

  /**
   * Get posts by user ID
   */
  getPostsByUserId: async (userId: string): Promise<InstagramPost[]> => {
    const posts = await prisma.instagramPost.findMany({
      where: { authorId: userId },
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

    return posts as InstagramPost[]
  },

  /**
   * Get post by ID
   */
  getPostById: async (postId: string): Promise<InstagramPost | null> => {
    const post = await prisma.instagramPost.findUnique({
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

    return post as InstagramPost | null
  },

  /**
   * Create a new Instagram post
   */
  createPost: async (authorId: string, input: CreateInstagramPostInput): Promise<InstagramPost> => {
    try {
      const postData: any = {
        imageUrl: input.imageUrl,
        caption: input.caption?.trim() || null,
        authorId,
      }

      logger.info({ authorId, postData }, "Attempting to create Instagram post")

      const post = await prisma.instagramPost.create({
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

      logger.info({ postId: post.id, authorId }, "Instagram post created")
      return post as InstagramPost
    } catch (error: any) {
      logger.error({
        error: error.message,
        code: error.code,
        meta: error.meta,
        authorId,
        input,
      }, "Prisma error creating Instagram post")
      throw error
    }
  },

  /**
   * Update an Instagram post
   */
  updatePost: async (
    postId: string,
    authorId: string,
    input: UpdateInstagramPostInput
  ): Promise<InstagramPost> => {
    // Verify ownership
    const existingPost = await prisma.instagramPost.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      throw new Error("Post not found")
    }

    if (existingPost.authorId !== authorId) {
      throw new Error("Not authorized to update this post")
    }

    const post = await prisma.instagramPost.update({
      where: { id: postId },
      data: {
        ...(input.caption !== undefined && {
          caption: input.caption && input.caption.trim() !== "" ? input.caption.trim() : null,
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

    logger.info({ postId, authorId }, "Instagram post updated")
    return post as InstagramPost
  },

  /**
   * Delete an Instagram post
   */
  deletePost: async (postId: string, authorId: string): Promise<void> => {
    // Verify ownership
    const existingPost = await prisma.instagramPost.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      throw new Error("Post not found")
    }

    if (existingPost.authorId !== authorId) {
      throw new Error("Not authorized to delete this post")
    }

    await prisma.instagramPost.delete({
      where: { id: postId },
    })

    logger.info({ postId, authorId }, "Instagram post deleted")
  },

  /**
   * Add a comment to a post
   */
  addComment: async (
    postId: string,
    authorId: string,
    input: CreateInstagramCommentInput
  ): Promise<InstagramComment> => {
    const comment = await prisma.instagramComment.create({
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

    logger.info({ commentId: comment.id, postId, authorId }, "Instagram comment added")
    return comment as InstagramComment
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string, authorId: string): Promise<void> => {
    // Verify ownership
    const existingComment = await prisma.instagramComment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      throw new Error("Comment not found")
    }

    if (existingComment.authorId !== authorId) {
      throw new Error("Not authorized to delete this comment")
    }

    await prisma.instagramComment.delete({
      where: { id: commentId },
    })

    logger.info({ commentId, authorId }, "Instagram comment deleted")
  },

  /**
   * Toggle like on a post
   */
  toggleLike: async (postId: string, userId: string): Promise<{ liked: boolean }> => {
    const existingLike = await prisma.instagramLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.instagramLike.delete({
        where: { id: existingLike.id },
      })
      logger.info({ postId, userId }, "Instagram post unliked")
      return { liked: false }
    } else {
      // Like
      await prisma.instagramLike.create({
        data: {
          postId,
          userId,
        },
      })
      logger.info({ postId, userId }, "Instagram post liked")
      return { liked: true }
    }
  },

  /**
   * Check if user has liked a post
   */
  hasUserLiked: async (postId: string, userId: string): Promise<boolean> => {
    const like = await prisma.instagramLike.findUnique({
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
