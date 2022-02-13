import React, { useRef, useState, useEffect } from 'react';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { Themeable2, useStyles2, useTheme2, withTheme2 } from '@grafana/ui';
import { debounce } from 'lodash';
import * as echarts from 'echarts';
import { css,  cx  } from '@emotion/css';
import { SimpleOptions, funcParams } from 'types';

// just comment it if don't need it
import 'echarts-wordcloud';
import 'echarts-liquidfill';
import 'echarts-gl';

// auto register map
echarts.registerMap('china', require('map/china.json'));

const getStyles = (theme: GrafanaTheme2) => ({
  tips: css`
    padding: 0 10%;
    height: 100%;
    background: rgba(128, 128, 128, 0.1);
    overflow: auto;
  `,
  tipsTitle: css`
    margin: 48px 0 32px;
    text-align: center;
  `,
  wrapper: css`
    position: relative;
  `,
});

type Props = PanelProps<SimpleOptions> & Themeable2;

const PartialSimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = useStyles2(getStyles);
  const echartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts>();
  const [tips, setTips] = useState<Error | undefined>();
  const theme = useTheme2();

  const resetOption = debounce(
    () => {
      if (!chart) {
        return;
      }
      if (data.state && data.state !== 'Done') {
        return;
      }
      try {
        setTips(undefined);
        chart.clear();
        let getOption = new Function(funcParams, options.getOption);
        const o = getOption(data, theme, chart, echarts);
        o && chart.setOption(o);
      } catch (err) {
        console.error('Editor content error!', err);
        setTips(err as Error);
      }
    },
    150,
    { leading: true }
  );

  useEffect(() => {
    if (echartRef.current) {

      if (chart  && !chart.isDisposed) {
        chart?.clear();
        chart?.dispose();
      }

      let themeECharts = undefined;

      if (options.followTheme) {
        if (theme.isDark) {
          themeECharts = 'dark';
        }

        if (theme.isLight) {
          themeECharts = 'light';
        }
      }

      setChart(echarts.init(echartRef.current, themeECharts, { renderer: 'svg' }));
    }

    return () => {
      if (chart  && !chart.isDisposed) {
        chart?.clear();
        chart?.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echartRef.current, options.followTheme]);

  useEffect(() => {
    chart?.resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useEffect(() => {
    chart && resetOption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, options.getOption, data]);

  return (
    <>
      {tips && (
        <div className={styles.tips}>
          <h5 className={styles.tipsTitle}>Editor content error!</h5>
          {(tips.stack || tips.message).split('\n').map(s => (
            <p>{s}</p>
          ))}
        </div>
      )}
      <div
        ref={echartRef}
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
          `
        )}
      />
    </>
  );
};

export const SimplePanel = withTheme2(PartialSimplePanel);
