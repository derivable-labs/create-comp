import React, { useEffect, useRef, useState } from 'react'
import './style.scss'
import { useWindowSize } from '../../../hooks/useWindowSize'

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: any
  setTab: any
  tab: any
}

export const Tabs = (props: TabProps) => {
  const setTab = props.setTab
  const currentTab = props.tab
  const tabs = props.tabs
  const ref = useRef<any>()
  const [id] = useState<any>('id-' + Math.floor(Math.random() * 10000))
  const [sliderStyle, setSliderStyle] = useState<any>({})
  const { width } = useWindowSize()

  useEffect(() => {
    const item: any = document.querySelector('.derivable-tabs__item.' + id + '.active')
    setSliderStyle({
      left: item.offsetLeft,
      width: item.offsetWidth,
      height: item.offsetHeight
    })
  }, [currentTab, width])

  return (
    <React.Fragment>
      <div className={`derivable-tabs ${props.className}`} ref={ref}>
        <div className='derivable-tabs__slider' style={sliderStyle} />
        {tabs.map((tab: any, key: number) => {
          return (
            <span
              key={key}
              className={`derivable-tabs__item ${id} ${
                currentTab === tab.value ? 'active' : ''
              }`}
              onClick={() => setTab(tab.value)}
            >
              <span>{tab.name}</span>
            </span>
          )
        })}
      </div>
    </React.Fragment>
  )
}
