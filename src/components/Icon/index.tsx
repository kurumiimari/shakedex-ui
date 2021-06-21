import React, {Component, MouseEventHandler} from "react";
import './icon.scss';

type Props = {
  url?: string;
  material?: string;
  className?: string;
  size?: number;
  onClick?: MouseEventHandler;
  disabled?: boolean;
}

export default class Icon extends Component<Props> {
  render() {
    const {
      url,
      size = 0.75,
      className = '',
      onClick,
      disabled,
      material,
    } = this.props;

    return onClick
      ? (
        <button
          className={`icon ${className}`}
          style={{
            backgroundImage: url ? `url(${url})` : undefined,
            width: !material ? `${size}rem` : undefined,
            height: !material ? `${size}rem` : undefined,
            fontSize: material && `${size}rem`,
          }}
          onClick={onClick}
          disabled={disabled}
        >
          {material}
        </button>
      )
      : (
      <div
        className={`icon ${className} ${disabled ? 'icon--disabled' : ''}`}
        style={{
          backgroundImage: `url(${url})`,
          width: !material ? `${size}rem` : undefined,
          height: !material ? `${size}rem` : undefined,
          fontSize: material && `${size}rem`,
        }}
      >
        {material}
      </div>
    )
  }
}
