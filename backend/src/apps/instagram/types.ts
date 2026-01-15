export interface InstagramPost {
  id: string
  imageUrl: string // Required for Instagram
  caption?: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  _count?: {
    comments: number
    likes: number
  }
  likes?: InstagramLike[]
  comments?: InstagramComment[]
}

export interface InstagramComment {
  id: string
  content: string
  postId: string
  authorId: string
  createdAt: Date
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

export interface InstagramLike {
  id: string
  postId: string
  userId: string
  createdAt: Date
  user: {
    id: string
    username: string
    name: string | null
  }
}

export interface CreateInstagramPostInput {
  imageUrl: string // Required
  caption?: string
}

export interface UpdateInstagramPostInput {
  caption?: string
}

export interface CreateInstagramCommentInput {
  content: string
}
