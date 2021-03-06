import React from 'react';
import PropTypes from 'prop-types';

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  AppState
} from 'react-native';
import _ from 'lodash';
import {sprintf} from 'sprintf-js';

const DEFAULT_CD_LABEL_TXT_COLOR = '#000';
const DEFAULT_BG_COLOR = '#FAB913';
const DEFAULT_TIME_TXT_COLOR = '#000';
const DEFAULT_DIGIT_TXT_COLOR = '#000';
const DEFAULT_TIME_TO_SHOW = ['D', 'H', 'M', 'S'];
const DEFAULT_DAYS_TXT = 'Days';
const DEFAULT_HOURS_TXT = 'Hours';
const DEFAULT_MINUTES_TXT = 'Minutes';
const DEFAULT_SECONDS_TXT = 'Seconds';

class CountDown extends React.Component {
  static propTypes = {
    cdCountingLabelTxt: PropTypes.string,
    cdZeroTimerLabelTxt: PropTypes.string,
    cdLabelTxtColor: PropTypes.string,
    cdLabelFontFamily: PropTypes.string,
    cdLabelSize: PropTypes.number,
    digitBgColor: PropTypes.string,
    digitTxtColor: PropTypes.string,
    timeTxtColor: PropTypes.string,
    timeToShow: PropTypes.array,
    daysTxt: PropTypes.string,
    hoursTxt: PropTypes.string,
    minutesTxt: PropTypes.string,
    secondsTxt: PropTypes.string,
    size: PropTypes.number,
    until: PropTypes.number,
    visibleWhenUntil: PropTypes.number,
    onFinish: PropTypes.func,
    onPress: PropTypes.func,
  };

  state = {
    until: this.props.until,
    wentBackgroundAt: null,
  };

  componentDidMount() {
    if (this.props.onFinish) {
      this.onFinish = _.once(this.props.onFinish);
    }
    this.timer = setInterval(this.updateTimer, 1000);
    if (this.props.zeroTimerBlink) {
      this.blinkTimer = setInterval(this.blinkTimer, 1000);
    }
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    if (this.props.zeroTimerBlink) {
      clearInterval(this.blinkTimer);
    }
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = currentAppState => {
    const {until, wentBackgroundAt} = this.state;
    if (currentAppState === 'active' && wentBackgroundAt) {
      const diff = (Date.now() - wentBackgroundAt) / 1000.0;
      this.setState({until: Math.max(0, until - diff)});
    }
    if (currentAppState === 'background') {
      this.setState({wentBackgroundAt: Date.now()});
    }
  };

  _onFinish = () => {
    this.setState({until: 0});
    this.renderLabel(this.props.cdZeroTimerLabelTxt);
  };

  getTimeLeft = () => {
    const {until} = this.state;
    return {
      seconds: until % 60,
      minutes: parseInt(until / 60, 10) % 60,
      hours: parseInt(until / (60 * 60), 10) % 24,
      days: parseInt(until / (60 * 60 * 24), 10),
    };
  };

  updateTimer = () => {
    const {until} = this.state;

    if (until <= 1) {
      clearInterval(this.timer);
      if (this.onFinish) {
        this.onFinish();
      }
      this._onFinish();
    } else {
      this.setState({until: until - 1});
    }
  };

  blinkTimer = () => {
    const {until, digitTxtTransparent} = this.state;

    if (!until) {
      if (digitTxtTransparent) {
        this.setState({digitTxtTransparent: null});
      } else {
        this.setState({digitTxtTransparent: 'transparent'});
      }
    }
  };

  renderDigit = (d) => {
    const {digitBgColor, digitTxtColor, size} = this.props;
    return (
      <View style={[
        styles.digitCont,
        {backgroundColor: digitBgColor},
        {width: size * 2.3, height: size * 2.6},
      ]}>
        <Text style={[
          styles.digitTxt,
          {fontSize: size},
          {color: digitTxtColor},
          {color: this.state.digitTxtTransparent},
        ]}>
          {d}
        </Text>
      </View>
    );
  };

  renderDoubleDigits = (label, digits) => {
    const {timeTxtColor, size} = this.props;

    return (
      <View style={styles.doubleDigitCont}>
        <View style={styles.timeInnerCont}>
          {this.renderDigit(digits)}
        </View>
        {label ? (
          <Text style={[styles.timeTxt, { fontSize: size / 1.8 }, { color: timeTxtColor }]}>{label}</Text>
        ) : (
          <View />
        )}
      </View>
    );
  };

  renderLabel = (cdLabelTxt) => {
    const {cdLabelTxtColor, cdLabelFontFamily, cdLabelSize, size, until} = this.props;

    return (
      <Text style={[
        styles.cdLabelTxt,
        {color: cdLabelTxtColor},
        {fontFamily: cdLabelFontFamily},
        {fontSize: cdLabelSize || size / 1.2},
      ]}>
        {cdLabelTxt}
      </Text>
    )
  };

  renderCountDown = () => {
    const { visibleWhenUntil, cdCountingLabelTxt, cdZeroTimerLabelTxt,
      timeToShow, daysTxt, hoursTxt, minutesTxt, secondsTxt } = this.props;
    const {until} = this.state;
    const {days, hours, minutes, seconds} = this.getTimeLeft();
    const newTime = sprintf('%02d:%02d:%02d:%02d', days, hours, minutes, seconds).split(':');
    const Component = this.props.onPress ? TouchableOpacity : View;

    return visibleWhenUntil < until ? (
      <View />
    ) : (
      <Component onPress={this.props.onPress}>
        {(cdCountingLabelTxt || cdZeroTimerLabelTxt) && (
          <View style={styles.cdLabelCont}>
            {this.renderLabel(until > 0 ? cdCountingLabelTxt : cdZeroTimerLabelTxt)}
          </View>
        )}
        <View style={styles.timeCont}>
          {_.includes(timeToShow, 'D') ? this.renderDoubleDigits(daysTxt, newTime[0]) : null}
          {_.includes(timeToShow, 'H') ? this.renderDoubleDigits(hoursTxt, newTime[1]) : null}
          {_.includes(timeToShow, 'M') ? this.renderDoubleDigits(minutesTxt, newTime[2]) : null}
          {_.includes(timeToShow, 'S') ? this.renderDoubleDigits(secondsTxt, newTime[3]) : null}
        </View>
      </Component>
    );
  };

  render() {
    return (
      <View style={this.props.style}>
        {this.renderCountDown()}
      </View>
    );
  }
}

CountDown.defaultProps = {
  cdLabelTxtColor: DEFAULT_CD_LABEL_TXT_COLOR,
  digitBgColor: DEFAULT_BG_COLOR,
  digitTxtColor: DEFAULT_DIGIT_TXT_COLOR,
  timeTxtColor: DEFAULT_TIME_TXT_COLOR,
  timeToShow: DEFAULT_TIME_TO_SHOW,
  daysTxt: DEFAULT_DAYS_TXT,
  hoursTxt: DEFAULT_HOURS_TXT,
  minutesTxt: DEFAULT_MINUTES_TXT,
  secondsTxt: DEFAULT_SECONDS_TXT,
  until: 0,
  size: 15,
};

const styles = StyleSheet.create({
  timeCont: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cdLabelCont: {
    alignSelf: 'center',
  },
  cdLabelTxt: {
    marginVertical: 3,
  },
  timeTxt: {
    color: 'white',
    marginVertical: 2,
    backgroundColor: 'transparent',
  },
  timeInnerCont: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitCont: {
    borderRadius: 5,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleDigitCont: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitTxt: {
    color: 'white',
    fontWeight: 'bold',
  },
});

module.exports = CountDown;
