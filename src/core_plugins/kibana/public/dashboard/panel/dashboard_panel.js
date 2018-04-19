import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import _ from 'lodash';

import { PanelHeader } from './panel_header';
import { PanelError } from './panel_error';

export class DashboardPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: props.embeddableFactory ? null : `No factory found for embeddable`,
    };

    this.mounted = false;
  }

  async componentDidMount() {
    this.mounted = true;
    const {
      initialized,
      embeddableFactory,
      embeddableIsInitializing,
      panel,
      embeddableStateChanged,
      embeddableIsInitialized,
      embeddableError,
    } = this.props;

    if (!initialized) {
      embeddableIsInitializing();
      embeddableFactory.create(panel, embeddableStateChanged)
        .then((embeddable) => {
          if (this.mounted) {
            this.embeddable = embeddable;
            embeddableIsInitialized(embeddable.metadata);
            this.embeddable.onContainerStateChanged(this.props.containerState);
            this.embeddable.render(this.panelElement);
          } else {
            embeddable.destroy();
          }
        })
        .catch((error) => {
          if (this.mounted) {
            embeddableError(error.message);
          }
        });
    }
  }

  componentWillUnmount() {
    this.props.destroy();
    this.mounted = false;
    if (this.embeddable) {
      this.embeddable.destroy();
    }
  }

  onFocus = () => {
    const { onPanelFocused, panel } = this.props;
    if (onPanelFocused) {
      onPanelFocused(panel.panelIndex);
    }
  };

  onBlur = () => {
    const { onPanelBlurred, panel } = this.props;
    if (onPanelBlurred) {
      onPanelBlurred(panel.panelIndex);
    }
  };

  renderEmbeddableViewport() {
    return (
      <div
        id="embeddedPanel"
        className="panel-content"
        ref={panelElement => this.panelElement = panelElement}
      >
        {!this.props.initialized && 'loading...'}
      </div>
    );
  }

  shouldComponentUpdate(nextProps) {
    if (this.embeddable && !_.isEqual(nextProps.containerState, this.props.containerState)) {
      this.embeddable.onContainerStateChanged(nextProps.containerState);
    }

    return nextProps.error !== this.props.error ||
      nextProps.initialized !== this.props.initialized;
  }

  renderEmbeddedError() {
    return <PanelError error={this.props.error} />;
  }

  renderContent() {
    const { error } = this.props;
    if (error) {
      return this.renderEmbeddedError(error);
    } else {
      return this.renderEmbeddableViewport();
    }
  }

  render() {
    const { viewOnlyMode, panel } = this.props;
    const classes = classNames('panel panel-default', this.props.className, {
      'panel--edit-mode': !viewOnlyMode
    });
    return (
      <div
        className="dashboard-panel"
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      >
        <div
          className={classes}
          data-test-subj="dashboardPanel"
        >
          <PanelHeader
            panelId={panel.panelIndex}
          />

          {this.renderContent()}

        </div>
      </div>
    );
  }
}

DashboardPanel.propTypes = {
  viewOnlyMode: PropTypes.bool.isRequired,
  onPanelFocused: PropTypes.func,
  onPanelBlurred: PropTypes.func,
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  destroy: PropTypes.func.isRequired,
  containerState: PropTypes.shape({
    timeRange: PropTypes.object.isRequired,
    embeddableCustomization: PropTypes.object,
    hidePanelTitles: PropTypes.bool.isRequired,
  }),
  embeddableFactory: PropTypes.shape({
    create: PropTypes.func,
  }).isRequired,
  embeddableStateChanged: PropTypes.func.isRequired,
  embeddableIsInitialized: PropTypes.func.isRequired,
  embeddableError: PropTypes.func.isRequired,
  embeddableIsInitializing: PropTypes.func.isRequired,
  initialized: PropTypes.bool.isRequired,
  panel: PropTypes.shape({
    panelIndex: PropTypes.string,
  }).isRequired,
};