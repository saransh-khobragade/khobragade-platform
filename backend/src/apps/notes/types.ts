export interface Note {
  id: string
  content: string
  title: string | null
  shareId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateNoteInput {
  content: string
  title?: string
}

export interface UpdateNoteInput {
  content?: string
  title?: string
}



