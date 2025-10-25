import React from 'react'
import { auth } from '@clerk/nextjs';
function DocLayout(
    {children,
    params: {id},
    }: {
    children: React.ReactNode;
    params: {id: string};
}) {
    auth().protect();
  return (
    <div>{children}</div>
  )
}

export default DocLayout;