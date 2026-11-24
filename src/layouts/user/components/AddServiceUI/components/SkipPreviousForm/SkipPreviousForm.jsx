import React,{useEffect} from 'react'

const SkipPreviousForm = ({vehicle}) => {
	useEffect(() => {
	  vehicle.data.services
	}, [vehicle])
	
  return (
	<div>SkipPreviousForm</div>
  )
}

export default SkipPreviousForm