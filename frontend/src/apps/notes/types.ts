export interface Note {
  id: string
  content: string
  title: string | null
  shareId: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteInput {
  content: string
  title?: string
}

export interface UpdateNoteInput {
  content?: string
  title?: string
}



