import React from 'react';
import './list.css';

const List = ({items, clicked}) => {

    return (
        <ul className='list'>
            {
            items.v.map((item, index) => (
                <li key={item.Name+index} onClick={clicked}>{item.Name}</li>
            ))
            }
        </ul>
    )
};

export default List;