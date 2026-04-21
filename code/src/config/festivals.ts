// 内置节日 / 24 节气 / 星座 - 种子数据
export interface Festival {
  name: string;
  type: 'solar' | 'lunar' | 'solarterm';                 // 公历/农历/节气
  month: number;                                          // 1-12
  day: number;                                            // 1-31 或节气序号
}

export const BUILT_IN_FESTIVALS: Festival[] = [
  { name: '元旦',       type: 'solar', month: 1,  day: 1 },
  { name: '情人节',     type: 'solar', month: 2,  day: 14 },
  { name: '三八妇女节', type: 'solar', month: 3,  day: 8 },
  { name: '植树节',     type: 'solar', month: 3,  day: 12 },
  { name: '清明节',     type: 'solar', month: 4,  day: 5 },
  { name: '劳动节',     type: 'solar', month: 5,  day: 1 },
  { name: '青年节',     type: 'solar', month: 5,  day: 4 },
  { name: '母亲节',     type: 'solar', month: 5,  day: 12 },
  { name: '儿童节',     type: 'solar', month: 6,  day: 1 },
  { name: '父亲节',     type: 'solar', month: 6,  day: 16 },
  { name: '建党节',     type: 'solar', month: 7,  day: 1 },
  { name: '建军节',     type: 'solar', month: 8,  day: 1 },
  { name: '教师节',     type: 'solar', month: 9,  day: 10 },
  { name: '国庆节',     type: 'solar', month: 10, day: 1 },
  { name: '万圣节',     type: 'solar', month: 10, day: 31 },
  { name: '平安夜',     type: 'solar', month: 12, day: 24 },
  { name: '圣诞节',     type: 'solar', month: 12, day: 25 },
  { name: '春节',       type: 'lunar', month: 1,  day: 1 },
  { name: '元宵节',     type: 'lunar', month: 1,  day: 15 },
  { name: '端午节',     type: 'lunar', month: 5,  day: 5 },
  { name: '七夕',       type: 'lunar', month: 7,  day: 7 },
  { name: '中元节',     type: 'lunar', month: 7,  day: 15 },
  { name: '中秋节',     type: 'lunar', month: 8,  day: 15 },
  { name: '重阳节',     type: 'lunar', month: 9,  day: 9 },
  { name: '腊八节',     type: 'lunar', month: 12, day: 8 }
];

export const SOLAR_TERMS = [                              // 24 节气
  '小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
  '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
  '白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'
];

export const ZODIAC = [                                   // 星座
  '水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座',
  '狮子座','处女座','天秤座','天蝎座','射手座','摩羯座'
];

export const LUNAR_DAY = [                                // 农历日
  '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
];

export const LUNAR_MONTH = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
