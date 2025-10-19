/**
 * 本地景點資料
 * 遷移自原有的 index.html
 */
import { LocalAttraction } from './types';

export const localAttractions: LocalAttraction[] = [
  {
    name: '故宮博物院',
    area: '北京市',
    openTime: '08:30-17:00（週一閉館，法定節假日除外）',
    feature:
      '世界上現存規模最大、保存最為完整的木質結構古建築之一，收藏了大量珍貴的中國歷代文物。',
    image: 'img/1-gugong.jpeg',
    video: 'https://www.youtube.com/watch?v=-3sKZYrLcu8',
  },
  {
    name: '八達嶺長城',
    area: '北京市',
    openTime: '07:30-17:30（季節性調整）',
    feature:
      '明長城中保存最好的一段，也是最具代表性的一段，是觀賞長城壯麗景觀的絕佳地點。',
    image: 'img/2-changcheng.jpeg',
    video: 'https://www.youtube.com/watch?v=NukprmpYw6k',
  },
  {
    name: '頤和園',
    area: '北京市',
    openTime: '06:30-18:00（園內景點開放時間不同）',
    feature: '保存最完整的一座皇家行宮御苑，被譽為「皇家園林博物館」。',
    image: 'img/3-yiheyuan.jpg',
    video: 'https://www.youtube.com/watch?v=nFfDvCWrvHk',
  },
  {
    name: '廣州塔',
    area: '廣東省廣州市',
    openTime: '09:30-22:30（視季節及活動調整）',
    feature:
      '又稱小蠻腰，是中國第二高塔，擁有觀光平台、摩天輪、空中步道等多種娛樂設施，夜景燈光秀尤為著名。',
    image: 'img/4-guangzhouta.jpeg',
    video: 'https://www.youtube.com/watch?v=-UIKvs8N5pA',
  },
  {
    name: '上海迪士尼樂園',
    area: '上海市',
    openTime: '08:30-21:30（平日），08:00-22:00（週末及節假日）',
    feature:
      '中國大陸首座迪士尼主題樂園，包含六大主題園區和眾多精彩的遊樂設施與表演。',
    image: 'img/5-shanghai-disneyland.jpg',
    video: 'https://www.youtube.com/watch?v=8ymmpDRZQjs',
  },
  {
    name: '上海灘',
    area: '上海市',
    openTime: '全天開放',
    feature:
      '上海的地標之一，是黃浦江兩岸風景的觀賞點，一邊是近代建築群「萬國建築博覽群」，一邊是現代摩天大樓。',
    image: 'img/6-shanghai-bund.jpg',
    video: 'https://www.youtube.com/watch?v=G7AC5LvD3r0',
  },
  {
    name: '杭州西湖',
    area: '浙江省杭州市',
    openTime: '全天開放（景點及遊船有單獨時間）',
    feature:
      '中國大陸首批國家重點風景名勝區和中國十大風景名勝之一，以其秀麗的湖光山色和眾多的名勝古蹟聞名於世。',
    image: 'img/7-hangzhouxihu.jpeg',
    video: 'https://www.youtube.com/watch?v=ZNgGk0_DT3c',
  },
  {
    name: '蘇州園林（拙政園）',
    area: '江蘇省蘇州市',
    openTime:
      '07:30-17:30（3月1日-11月15日），07:30-17:00（11月16日-2月29日）',
    feature:
      '中國園林藝術的傑出代表，被譽為「咫尺山林，多方勝景」，以其佈局精巧、古樸典雅著稱。',
    image: 'img/8-suzhouyuanlin.png',
    video: 'https://www.youtube.com/watch?v=MjMsRDQC3V4',
  },
  {
    name: '香港迪士尼樂園',
    area: '香港特別行政區',
    openTime: '10:30-19:30（時間會浮動）',
    feature: '亞洲第二座、中國第一座迪士尼主題樂園，包含七大主題園區。',
    image: 'img/9-hongkong-disneyland.jpg',
    video: 'https://www.youtube.com/watch?v=i78E0OcMRvY',
  },
  {
    name: '香港海洋公園',
    area: '香港特別行政區',
    openTime: '10:00-19:00（平日），10:00-20:00（週末及公眾假期）',
    feature:
      '集海洋動物展示、動物表演、機動遊戲和園林於一身的大型主題公園。',
    image: 'img/10-hongkong-oceanpark.jpg',
    video: 'https://www.youtube.com/watch?v=GygLzhbUbrg',
  },
  {
    name: '太平山頂',
    area: '香港特別行政區',
    openTime: '纜車服務 07:00-22:00；凌霄閣 10:00-23:00',
    feature:
      '香港的地標之一，是香港島的最高峰，可俯瞰香港島、九龍半島和維多利亞港的壯麗景色。',
    image: 'img/11-hongkong-victoriapeak.jpg',
    video: 'https://www.youtube.com/watch?v=ZXP9q7fT7pU',
  },
  {
    name: '黃山',
    area: '安徽省黃山市',
    openTime:
      '06:30-17:00（3月1日-11月30日），07:00-16:30（12月1日-2月28日）',
    feature:
      '中國十大風景名勝唯一的山嶽風景，以奇松、怪石、雲海、溫泉「四絕」著稱。',
    image: 'img/12-huangshan-mountain.jpg',
    video: 'https://www.youtube.com/watch?v=mixa1JFC8vY',
  },
  {
    name: '張家界國家森林公園',
    area: '湖南省張家界市',
    openTime:
      '07:00-18:00（4月1日-10月31日），07:30-17:30（11月1日-3月31日）',
    feature:
      '中國第一個國家森林公園，以奇特的石英砂岩峰林地貌聞名，是電影《阿凡達》「哈利路亚山」的取景地。',
    image: 'img/13-zhangjiajie.jpg',
    video: 'https://www.youtube.com/watch?v=RoAFoGnapWQ',
  },
  {
    name: '九寨溝風景名勝區',
    area: '四川省阿壩藏族羌族自治州',
    openTime:
      '08:30-17:00（4月1日-11月15日），08:30-17:30（11月16日-3月31日）',
    feature:
      '以典型的高山湖泊、瀑布、鈣華灘流等地表水景為主，景觀奇特、色彩繽紛，被譽為「人間仙境」。',
    image: 'img/14-jiuzhaigou.jpg',
    video: 'https://www.youtube.com/watch?v=DKLP_By5gBo',
  },
  {
    name: '麗江古城',
    area: '雲南省麗江市',
    openTime: '全天開放（景點有單獨時間）',
    feature:
      '中國歷史上保存最完整的少數民族古城，已有800多年曆史，整個古城依山傍水，呈現出獨特的水鄉風貌。',
    image: 'img/15-lijiang.jpg',
    video: 'https://www.youtube.com/watch?v=d2f2GwwmMsg',
  },
  {
    name: '鼓浪嶼',
    area: '福建省廈門市',
    openTime: '全天開放（島上景點有單獨時間）',
    feature:
      '有「海上花園」之譽，是一座風格獨特的「建築博覽島」，融合了中西建築風格。',
    image: 'img/16-gulangyu.jpg',
    video: 'https://www.youtube.com/watch?v=myaZNoLwO9M',
  },
  {
    name: '秦始皇兵馬俑博物館',
    area: '陝西省西安市',
    openTime:
      '08:30-18:00（3月16日-11月15日），08:30-17:30（11月16日-3月15日）',
    feature:
      '世界八大奇蹟之一，是中國歷史上第一位皇帝秦始皇的陪葬坑，出土了成千上萬件與真人真馬大小相當的陶俑。',
    image: 'img/17-bingmayong.jpg',
    video: 'https://www.youtube.com/watch?v=d5GFkUCUyf0',
  },
  {
    name: '布達拉宮',
    area: '西藏自治區拉薩市',
    openTime: '09:30-15:00（週一閉館）',
    feature:
      '世界上面海拔最高的宮殿式建築群，是一座巨大的宮堡式建築，雄偉壯觀，是藏族建築藝術的傑作。',
    image: 'img/18-potala-palace.jpg',
    video: 'https://www.youtube.com/watch?v=Z4WkevnpXTY',
  },
  {
    name: '桂林山水',
    area: '廣西壯族自治區桂林市',
    openTime: '全天開放（景點及遊船有單獨時間）',
    feature:
      '以「山青、水秀、洞奇、石美」著稱，素有「桂林山水甲天下」的美譽。',
    image: 'img/19-guilin.jpg',
    video: 'https://www.youtube.com/watch?v=sJ4ymHJmHEo',
  },
  {
    name: '三亞亞龍灣',
    area: '海南省三亞市',
    openTime: '全天開放',
    feature:
      '號稱「天下第一灣」，擁有潔白的沙灘、清澈的海水和絢麗的海底珊瑚景觀，是理想的熱帶海濱度假勝地。',
    image: 'img/20-sanya-yalongbay.jpg',
    video: 'https://www.youtube.com/watch?v=kAN3Y9CQkoM',
  },
];

