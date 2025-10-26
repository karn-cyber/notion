"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import DocumentWithRealCollab from '@/components/DocumentWithRealCollab'

function DocumentPage() {
  const params = useParams()
  const id = params.id as string

  return <div className="flex flex-col flex-1 min-h-screen"><DocumentWithRealCollab id={id} />
  </div>
}

export default DocumentPage;