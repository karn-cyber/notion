"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import Document from '@/components/Document'

function DocumentPage() {
  const params = useParams()
  const id = params.id as string

  return <div className="flex flex-col flex-1 min-h-screen"><Document id={id} />
  </div>
}

export default DocumentPage;