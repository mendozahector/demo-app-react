
import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export let candlestickSeries
export const ChartComponent = props => {
	const {
		colors: {
			upColor = '#26a69a',
			downColor = '#ef5350',
			wickUpColor = '#26a69a',
			wickDownColor = '#ef5350',
			borderVisible = false,
      backgroundColor = 'white',
      textColor = 'black'
		} = {},
	} = props;

	const chartContainerRef = useRef();

	useEffect(
		() => {
			const handleResize = () => {
				chart.applyOptions({ width: chartContainerRef.current.clientWidth });
			};

			const chart = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: backgroundColor },
					textColor,
				},
				width: chartContainerRef.current.clientWidth,
				height: 300,
        timeScale: {
          timeVisible: true,
          secondsVisible: false
      }
			});

			candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);

				chart.remove();
			};
		},
		[upColor, downColor, wickUpColor, wickDownColor, borderVisible, backgroundColor, textColor]
	);

	return (
		<div
			ref={chartContainerRef}
		/>
	);
};

let minuteBar = {time: 0, open: 0, high: 0, low: 0, close: 0}
async function data_websocket() {
  let socket = new WebSocket("wss://ws.bitstamp.net/");

  async function ontrade(trade) {
    let ts = new Date(Number(trade.timestamp) * 1000)
    ts.setMilliseconds(0)
    ts.setSeconds(0)
    ts = ts.getTime() / 1000
    const p = trade.price

    if (ts === minuteBar['time']) {
      minuteBar['close'] = p
      if (minuteBar['high'] < p) minuteBar['high'] = p
      if (minuteBar['low'] > p) minuteBar['low'] = p
    } else {
      minuteBar['time'] = ts
      minuteBar['open'] = p
      minuteBar['high'] = p
      minuteBar['low'] = p
      minuteBar['close'] = p
    }

    candlestickSeries.update(minuteBar)
  }

  socket.onopen = function(e) {
    const subscription = {
        "event": "bts:subscribe",
        "data": {
            "channel": "live_trades_btcusd"
        }
    }
    socket.send(JSON.stringify(subscription));
  };
    
  socket.onmessage = function(message) {
    const data = JSON.parse(message.data);
    if (data.event === 'trade') ontrade(data.data)
  };
}
data_websocket()

function App(props) {
  return (
    <div id='container'>
      <h1>BTC/USD Realtime Price Data</h1>
      <ChartComponent {...props} ></ChartComponent>
    </div>
  );
}

export default App;
