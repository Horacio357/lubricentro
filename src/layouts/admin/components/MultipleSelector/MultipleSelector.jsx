import React from 'react';
import st from './MultipleSelector.module.css';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const customStyles = {
    control: (base, state) => ({
      ...base,
      border: "2px solid rgb(37, 37, 37)",
      backgroundColor: "rgb(46, 46, 46)",
      color: "rgb(255, 255, 255)",
      borderRadius: "10px",
      boxSizing: "border-box",
      outline: "none",
      maxWidth: "400px",
      width: "100%",
      minHeight: "40px",
      marginBottom: "15px",
      paddingLeft: "0",
      boxShadow: state.isFocused ? "0 0 0 1px rgb(80, 80, 80)" : "none",
      "&:hover": {
        borderColor: "rgb(80, 80, 80)",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "white",
    }),
    input: (base) => ({
      ...base,
      color: "white",
    }),
    placeholder: (base) => ({
      ...base,
      color: "rgb(128, 128, 128)",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "rgb(60, 60, 60)"
        : "rgb(46, 46, 46)",
      color: "white",
      cursor: "pointer",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "rgb(46, 46, 46)",
      borderRadius: "10px",
      marginTop: "4px",
      zIndex: 10,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "white",
      paddingRight: "10px",
    }),
    indicatorSeparator: () => ({
      display: "none",
    })
};

const MultipleSelector = ({ options, value, onChange, placeholder, isCreatable = false }) => {
    const SelectComponent = isCreatable ? CreatableSelect : Select;
  
    return (
      <SelectComponent
        id="marca"
        styles={customStyles}
        options={options}
        value={value ? { label: value, value } : null}
        onChange={(selected) => onChange(selected ? selected: null)}
        placeholder={placeholder}
        formatCreateLabel={(inputValue) => `¿Agregar "${inputValue}"?` }
        isSearchable
      />
    );
  };
  
  export default MultipleSelector;
