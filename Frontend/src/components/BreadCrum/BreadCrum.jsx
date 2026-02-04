import React from 'react'
import { Breadcrumbs, Link } from '@mui/material'

const BreadCrum = ({ crumbs }) => {
  return (
    <div className='py-2 md:py-8  bg-[linear-gradient(90deg,_var(--secondary)_0%,_var(--primary)_100%)]'>
      <div className='flex justify-center items-center'>
        <Breadcrumbs separator={<span style={{ color: 'white', fontSize: '28px' }}>/</span>}>
          {crumbs.map((crumb, index) => (
            <Link
              key={index}
              href={crumb.href}
              fontSize={{sm:'18px',md:'24px',lg:'28px'}}
              sx={{ color: 'white',fontWeight:600,  }}
              
            ><span style={{ fontFamily: 'Poppins, sans-serif' }}>{crumb.label}</span>

             
            </Link>
          ))}
        </Breadcrumbs>
      </div>
    </div>
  )
}

export default BreadCrum
