// 主题换肤 - 15 款主题 + 自动切换 + 微调 (v0.20.0 增强动画)
import React, { useState } from 'react';
import { BulbOutlined, CheckCircleFilled, ClockCircleOutlined, HighlightOutlined, SyncOutlined } from '@ant-design/icons';
import { Card, Col, Row, Slider, Space, Statistic, Switch, Tag, Typography } from 'antd';
import { THEMES, type ThemeMeta } from '@/config/themes';
import { useSettingsStore } from '@/stores/settingsStore';
import { isDayThemeTime, normalizeClock, resolveAutoTheme } from '@/utils/themeAuto';
import { useThemeVariants } from '@/hooks/useVariants';

const GROUPS: Array<{ key: string; label: string; desc: string; match: (theme: ThemeMeta) => boolean; }> = [
  { key: 'cyber', label: '赛博系列', desc: '霓虹、终端、未来感，共 7 款', match: theme => theme.style === 'cyberpunk' },
  { key: 'minimal', label: '极简系列', desc: '留白、克制、去装饰，共 7 款', match: theme => theme.style === 'minimal' },
  { key: 'gradient', label: '渐变系列', desc: '色彩流动、情绪氛围，共 7 款', match: theme => theme.style === 'gradient' },
  { key: 'classic', label: '经典系列', desc: '白天、黑夜、复古等保留风格', match: theme => theme.style === 'light' || theme.style === 'dark' || theme.style === 'retro' }
];

function TimeField({ value, onChange, textColor, borderColor, background }: { value: string; onChange: (next: string) => void; textColor: string; borderColor: string; background: string; }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 44,
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        background,
        color: textColor,
        padding: '0 14px',
        outline: 'none',
        transition: 'all 0.25s ease',
        fontSize: 14
      }}
    />
  );
}

export default function ThemeSkinPage() {
  const theme = useSettingsStore(s => s.theme);
  const themeMode = useSettingsStore(s => s.themeMode);
  const autoThemeDay = useSettingsStore(s => s.autoThemeDay);
  const autoThemeNight = useSettingsStore(s => s.autoThemeNight);
  const autoThemeDayStart = useSettingsStore(s => s.autoThemeDayStart);
  const autoThemeNightStart = useSettingsStore(s => s.autoThemeNightStart);
  const brightness = useSettingsStore(s => s.brightness);
  const blur = useSettingsStore(s => s.blur);
  const setTheme = useSettingsStore(s => s.setTheme);
  const setBrightness = useSettingsStore(s => s.setBrightness);
  const setBlur = useSettingsStore(s => s.setBlur);
  const setKV = useSettingsStore(s => s.setKV);
  const { theme: currentTheme, getPanelStyle } = useThemeVariants();

  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const nowIsDay = isDayThemeTime(new Date(), autoThemeDayStart, autoThemeNightStart);
  const autoResolved = resolveAutoTheme(Date.now(), autoThemeDay, autoThemeNight, autoThemeDayStart, autoThemeNightStart);
  const autoResolvedTheme = THEMES.find(item => item.key === autoResolved) || currentTheme;
  const autoDayTheme = THEMES.find(item => item.key === autoThemeDay) || THEMES[0];
  const autoNightTheme = THEMES.find(item => item.key === autoThemeNight) || THEMES[0];
  const isAuto = themeMode === 'auto';

  const applyTheme = async (nextTheme: string) => {
    if (!isAuto) {
      await setTheme(nextTheme);
      return;
    }
    if (nowIsDay) await setKV('autoThemeDay', nextTheme);
    else await setKV('autoThemeNight', nextTheme);
    await setTheme(nextTheme);
  };

  const panelStyle = getPanelStyle();
  const softText = panelStyle.subColor || 'rgba(100,116,139,0.85)';
  const titleText = panelStyle.titleColor || panelStyle.color || '#0f172a';
  const borderColor = currentTheme.accent + '33';
  const tint = currentTheme.accent + '1f';
  const isDark = currentTheme.style === 'dark' || currentTheme.style === 'cyberpunk' || currentTheme.key === 'minimal_dark';
  const controlBg = isDark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.82)';

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Hero */}
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 30,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${currentTheme.gradient[0]}33 0%, rgba(10,14,28,0.95) 50%, rgba(6,8,18,0.98) 100%)`
            : `linear-gradient(135deg, ${currentTheme.gradient[0]} 0%, ${currentTheme.gradient[1]} 100%)`,
          boxShadow: isDark
            ? `0 28px 60px ${currentTheme.accent}24, 0 0 40px ${currentTheme.accent}10`
            : `0 28px 60px ${currentTheme.accent}30`,
          border: isDark ? `1px solid ${currentTheme.accent}33` : 'none'
        }}
        bodyStyle={{ padding: 26 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${currentTheme.accent}aa` : 'rgba(255,255,255,0.82)' }}>
              主题工作台
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{
                margin: '8px 0 10px',
                color: '#fff',
                fontFamily: currentTheme.fontFamily,
                textShadow: isDark ? `0 0 20px ${currentTheme.accent}66` : 'none'
              }}
            >
              把 AixSystems 调成真正愿意长期打开的样子
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(255,255,255,0.84)', maxWidth: 720 }}>
              当前主题是「{currentTheme.label}」。{THEMES.length} 款内置主题覆盖赛博、极简、渐变、复古等多种风格，支持按时间自动切换。
            </Typography.Paragraph>
            <Space wrap size={8}>
              <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>当前 {currentTheme.label}</Tag>
              <Tag color="green" style={{ background: isDark ? 'rgba(34,197,94,0.2)' : undefined }}>{isAuto ? '自动切换已开启' : '手动模式'}</Tag>
              <Tag color="gold" style={{ background: isDark ? 'rgba(245,158,11,0.2)' : undefined }}>亮度 {brightness}%</Tag>
              <Tag color="purple" style={{ background: isDark ? 'rgba(168,85,247,0.2)' : undefined }}>模糊 {blur}</Tag>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card
                  bordered={false}
                  className="hover-lift"
                  style={{
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.14)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Statistic title="主题数" value={THEMES.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  bordered={false}
                  className="hover-lift"
                  style={{
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.14)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Statistic
                    title="主色"
                    value={currentTheme.accent}
                    valueStyle={{ color: '#fff', fontSize: 16 }}
                  />
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  bordered={false}
                  className="hover-lift"
                  style={{
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.14)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.82)' }}>自动切换结果</Typography.Text>
                  <div style={{ marginTop: 6, color: '#fff', fontWeight: 700 }}>{autoResolvedTheme.label}</div>
                  <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.78)', fontSize: 12 }}>
                    当前处于{nowIsDay ? '日间' : '夜间'}时段，时间点 {autoThemeDayStart} / {autoThemeNightStart}
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2"
            style={{ ...panelStyle, borderRadius: 24 }}
          >
            <Typography.Text style={{ color: softText }}>主题自动切换</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleText }}>
              <SyncOutlined /> 白天与夜间自动换肤
            </Typography.Title>
            <Row gutter={[14, 14]}>
              <Col span={24}>
                <div
                  className="hover-scale"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: 14,
                    borderRadius: 18,
                    background: tint,
                    border: `1px solid ${borderColor}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div>
                    <div style={{ color: titleText, fontWeight: 700 }}>开启自动切换</div>
                    <div style={{ color: softText, fontSize: 12, marginTop: 4 }}>
                      开启后会在启动时和运行过程中自动同步到当前时段主题。
                    </div>
                  </div>
                  <Switch
                    checked={isAuto}
                    onChange={value => setKV('themeMode', value ? 'auto' : 'manual')}
                  />
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ color: softText, marginBottom: 8 }}>白天主题</div>
                <select
                  value={autoThemeDay}
                  onChange={e => void setKV('autoThemeDay', e.target.value)}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 14,
                    border: `1px solid ${borderColor}`,
                    background: controlBg,
                    color: titleText,
                    padding: '0 12px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {THEMES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ color: softText, marginBottom: 8 }}>夜间主题</div>
                <select
                  value={autoThemeNight}
                  onChange={e => void setKV('autoThemeNight', e.target.value)}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 14,
                    border: `1px solid ${borderColor}`,
                    background: controlBg,
                    color: titleText,
                    padding: '0 12px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {THEMES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ color: softText, marginBottom: 8 }}>白天开始</div>
                <TimeField
                  value={autoThemeDayStart}
                  onChange={next => void setKV('autoThemeDayStart', normalizeClock(next, '07:00'))}
                  textColor={titleText}
                  borderColor={borderColor}
                  background={controlBg}
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ color: softText, marginBottom: 8 }}>夜间开始</div>
                <TimeField
                  value={autoThemeNightStart}
                  onChange={next => void setKV('autoThemeNightStart', normalizeClock(next, '19:00'))}
                  textColor={titleText}
                  borderColor={borderColor}
                  background={controlBg}
                />
              </Col>
              <Col span={24}>
                <Space wrap size={[8, 8]}>
                  <Tag
                    color="green"
                    style={{ background: isDark ? 'rgba(34,197,94,0.15)' : undefined }}
                  >
                    白天: {autoDayTheme.label}
                  </Tag>
                  <Tag
                    color="purple"
                    style={{ background: isDark ? 'rgba(168,85,247,0.15)' : undefined }}
                  >
                    夜间: {autoNightTheme.label}
                  </Tag>
                  <Tag
                    color="cyan"
                    style={{ background: isDark ? 'rgba(6,182,212,0.15)' : undefined }}
                  >
                    当前时段: {nowIsDay ? '白天' : '夜间'}
                  </Tag>
                </Space>
                <Typography.Paragraph style={{ color: softText, marginTop: 10, marginBottom: 0 }}>
                  自动切换开启后，点击下方主题卡会优先改写当前时段的主题槽位，并立即让界面切过去。
                </Typography.Paragraph>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3"
            style={{ ...panelStyle, borderRadius: 24 }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Typography.Text style={{ color: softText }}>主题微调</Typography.Text>
                <Typography.Title level={4} style={{ margin: '4px 0 8px', color: titleText }}>
                  <BulbOutlined /> 环境适配
                </Typography.Title>
                <Typography.Paragraph style={{ color: softText, marginBottom: 0 }}>
                  亮度决定背景存在感，模糊决定前后景分离感。强风格主题建议降低亮度、适度加一点模糊。
                </Typography.Paragraph>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: tint,
                  border: `1px solid ${borderColor}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <Typography.Title level={5} style={{ marginTop: 0, color: titleText }}>
                  <HighlightOutlined /> 亮度调节
                </Typography.Title>
                <Slider
                  min={30}
                  max={150}
                  value={brightness}
                  onChange={value => void setBrightness(value as number)}
                  trackStyle={{ background: currentTheme.accent }}
                  handleStyle={{ borderColor: currentTheme.accent }}
                />
                <Tag
                  color="blue"
                  style={{ background: isDark ? 'rgba(59,130,246,0.15)' : undefined }}
                >
                  当前亮度 {brightness}%
                </Tag>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: tint,
                  border: `1px solid ${borderColor}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <Typography.Title level={5} style={{ marginTop: 0, color: titleText }}>
                  <ClockCircleOutlined /> 模糊调节
                </Typography.Title>
                <Slider
                  min={0}
                  max={100}
                  value={blur}
                  onChange={value => void setBlur(value as number)}
                  trackStyle={{ background: currentTheme.accent }}
                  handleStyle={{ borderColor: currentTheme.accent }}
                />
                <Tag
                  color="purple"
                  style={{ background: isDark ? 'rgba(168,85,247,0.15)' : undefined }}
                >
                  当前模糊 {blur}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 主题分组展示 */}
      {GROUPS.map((group, groupIndex) => {
        const groupThemes = THEMES.filter(group.match);
        return (
          <Card
            key={group.key}
            bordered={false}
            className={`anim-fade-in-up stagger-${Math.min(groupIndex + 2, 8)}`}
            style={{ ...panelStyle, borderRadius: 24 }}
          >
            <Typography.Text style={{ color: softText }}>{group.label}</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 8px', color: titleText }}>
              {groupThemes.length} 款主题
            </Typography.Title>
            <Typography.Paragraph style={{ color: softText, marginBottom: 18 }}>{group.desc}</Typography.Paragraph>

            <Row gutter={[16, 16]}>
              {groupThemes.map((item, index) => {
                const isCurrent = theme === item.key;
                const isDaySlot = autoThemeDay === item.key;
                const isNightSlot = autoThemeNight === item.key;
                const isHovered = hoveredTheme === item.key;

                return (
                  <Col key={item.key} xs={24} md={12} xl={8}>
                    <button
                      type="button"
                      className="anim-fade-in-up"
                      onClick={() => void applyTheme(item.key)}
                      onMouseEnter={() => setHoveredTheme(item.key)}
                      onMouseLeave={() => setHoveredTheme(null)}
                      style={{
                        width: '100%',
                        border: isCurrent ? `2px solid ${item.accent}` : `1px solid ${borderColor}`,
                        borderRadius: 24,
                        padding: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: controlBg,
                        boxShadow: isCurrent
                          ? `0 18px 36px ${item.accent}30, 0 0 20px ${item.accent}18`
                          : isHovered
                            ? `0 20px 40px ${item.accent}20`
                            : '0 12px 28px rgba(15,23,42,0.08)',
                        textAlign: 'left',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
                        animationDelay: `${index * 0.06}s`
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        height: 144,
                        background: `linear-gradient(135deg, ${item.gradient[0]} 0%, ${item.gradient[1]} 100%)`,
                        overflow: 'hidden'
                      }}>
                        {/* 装饰光晕 */}
                        <div style={{
                          position: 'absolute',
                          top: '-30%',
                          right: '-20%',
                          width: '60%',
                          height: '120%',
                          borderRadius: '50%',
                          background: `radial-gradient(circle, ${item.accent}33 0%, transparent 70%)`,
                          transition: 'all 0.5s ease',
                          opacity: isHovered ? 1 : 0.6
                        }} />

                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18))'
                        }} />

                        <div style={{
                          position: 'absolute',
                          left: 16,
                          right: 16,
                          bottom: 14,
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap'
                        }}>
                          {isCurrent && (
                            <Tag style={{
                              margin: 0,
                              border: 'none',
                              background: 'rgba(255,255,255,0.22)',
                              color: '#fff',
                              backdropFilter: 'blur(8px)'
                            }}>
                              <CheckCircleFilled /> 当前
                            </Tag>
                          )}
                          {isDaySlot && !isCurrent && (
                            <Tag style={{
                              margin: 0,
                              border: 'none',
                              background: 'rgba(255,255,255,0.16)',
                              color: '#fff'
                            }}>
                              白天槽位
                            </Tag>
                          )}
                          {isNightSlot && !isCurrent && (
                            <Tag style={{
                              margin: 0,
                              border: 'none',
                              background: 'rgba(255,255,255,0.16)',
                              color: '#fff'
                            }}>
                              夜间槽位
                            </Tag>
                          )}
                        </div>
                      </div>

                      <div style={{ padding: '16px 16px 18px' }}>
                        <div style={{
                          fontWeight: 700,
                          color: titleText,
                          fontFamily: item.fontFamily,
                          fontSize: 15,
                          transition: 'color 0.3s ease'
                        }}
                        >
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: softText,
                          marginTop: 6,
                          minHeight: 34,
                          lineHeight: 1.5
                        }}
                        >
                          {item.summary}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginTop: 14
                        }}
                        >
                          <span style={{
                            fontSize: 12,
                            color: softText,
                            fontFamily: 'monospace'
                          }}
                          >
                            {item.accent}
                          </span>
                          <span style={{
                            fontSize: 12,
                            color: item.accent,
                            fontWeight: 700,
                            transition: 'all 0.3s ease',
                            opacity: isHovered ? 1 : 0.8
                          }}
                          >
                            {isAuto ? `应用到${nowIsDay ? '白天' : '夜间'}` : '立即使用'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </Col>
                );
              })}
            </Row>
          </Card>
        );
      })}
    </Space>
  );
}
