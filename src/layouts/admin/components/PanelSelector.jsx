import React from 'react';
import classes from '../Admin.module.css';

const PanelSelector = ({ panels, currentPanel, onPanelChange }) => {
  return (
    <div className={classes.navWrapper}>
      <select
        className={classes.panelSelector}
        value={currentPanel}
        onChange={(e) => onPanelChange(e.target.value)}
        aria-label="Seleccionar panel"
      >
        {panels.map((panel) => (
          <option
            key={panel}
            className={classes.panelSelectorOption}
            value={panel}
          >
            {panel}
          </option>
        ))}
      </select>

      <nav className={classes.panelTabs} aria-label="Navegación de paneles">
        {panels.map((panel) => {
          const isActive = panel === currentPanel;
          return (
            <button
              key={panel}
              type="button"
              className={`${classes.panelTab} ${
                isActive ? classes.panelTabActive : ''
              }`}
              onClick={() => onPanelChange(panel)}
            >
              {panel}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PanelSelector;