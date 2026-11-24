import React from 'react';
import ChecklistItem from '../ChecklistItem/ChecklistItem';
import ChecklistItemSides from '../ChecklistItemSides/ChecklistItemSides';


const ChecklistSection = ({data,  onToggle }) => {

  return (
    <section>
		<h2>{data.title}</h2>
		{
			data.items.map((item, index) => (
				item.sides ?
				<ChecklistItemSides
					key={item.label}
					label={item.label}
					checkedRight={item.not_passed_right}
					checkedLeft={item.not_passed_left}
					onChangeLeft={()=>onToggle({sectionIndex: index, side:'L'})}
					onChangeRight={()=>onToggle({sectionIndex: index, side: 'R'})} 
				/>
				:
				<ChecklistItem
					key={item.label}
					label={item.label}
					checked= {item.not_passed}
					onChange ={()=>onToggle({sectionIndex: index})}
				/>
			))
		}
    </section>
  );
};

export default ChecklistSection;