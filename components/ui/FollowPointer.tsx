import React from 'react'
import {motion} from 'framer-motion'
import stringToColor from '@/lib/stringToColor';
function FollowPointer({
    x,
    y,
    info}:
    {
    x: number;
    y: number;
    info: {
        name: string;
        email: string;
        avatar: string;
    };
    }     
) {
    const color = stringToColor(info.email || "1");
  return <motion.div className='h-4 w-4 rounded-full absolute z-50'
        style={{
            top: y,
            left: x,
            pointerEvents: 'none',
             }}
        initial={{scale:1,opacity:1}}
        animate={{scale:1,opacity:1}}
        exit={{scale:0,opacity:0}}
      >
        <svg
          stroke={color}
            fill={color}
            strokeWidth="0"
            viewBox="0 0 1024 1024"
            className={`h-6 w-6 text-[${color}] transform-rotate-[70deg] -translate-x-[12px] -translate-y-[10px] stroke-[${color}]`}
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
          </svg>
          <motion.div
          style={{
            backgroundColor: color,
          }}
          initial={{scale:0.5,opacity:0}}
          animate={{opacity:1,scale:1}}
          exit={{scale:0.5,opacity:0}}
          className={'px-2 py-2 bg-neutral-200 text-black font-bold whitespace-nowrap min-w-max text-xs rounded-full'}
            >
            {info?.name || info.email}
          </motion.div>
      </motion.div>
}

export default FollowPointer;