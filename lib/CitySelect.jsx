import React from "react";
import PropTypes from "prop-types";
// 引入组件样式

import data from "./data.json";
import iconSrc from "./location.png";
import reloadIcon from "./reload.png";
import styles from "./citySelect.scss";

const debounce = (fn, time) => {
  let timer = null;
  // tslint:disable-next-line:only-arrow-functions
  return function () {
    const self = debounce;
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      fn.apply(self, args);
    }, time);
  };
};

function log(info) {
  console.log(
    `%c react-city-select %c ${info} %c`,
    "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
    "background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff",
    "background:transparent"
  );
}

//判断城市数据里面有没有数据
function isCityNull(value) {
  const { indexCitys } = data;
  const cityName = value.replace("市", "");
  let flag = false;
  let keys = Object.keys(indexCitys);
  let ret = null;
  for (let i = 0; i < keys.length; i++) {
    let sec = keys[i];
    if (flag) {
      break;
    }
    for (let i = 0; i < indexCitys[sec].length; i++) {
      let item = indexCitys[sec][i];
      if (item.name.includes(cityName)) {
        ret = {
          id: item.id,
          name: item.name,
        };
        flag = true;
      }
    }
  }
  return ret;
}

export default class CitySelect extends React.Component {
  constructor(props) {
    super(props);
    this.gref = React.createRef();
    this.searchRef = React.createRef();
    this.changeHandler = this.changeHandler.bind(this);
    this.handleClear = this.handleClear.bind(this);
    // let newData = this.props.data.slice(0)
    const fromData = Object.fromEntries(Object.entries(this.props.data).filter(([key]) => !key.includes('hot')));
    const dataKeys = Object.keys(fromData).map((secKey) => secKey);
    // 根据数据项 键值 或 label属性 提取标识
    const noniusKeys = Object.keys(fromData).map(
      (secKey, secIndex) => secKey
    );
      console.log("xx",noniusKeys)
    if (this.props.config) {
      for (const key in this.props.config) {
        if (this.props.config.hasOwnProperty(key)) {
          const pos = noniusKeys.indexOf(key);
          if (pos > -1) {
            noniusKeys[pos] =
              this.props.config[key]["key"] ||
              this.props.config[key]["title"] ||
              noniusKeys[pos];
          }
        }
      }
    }

    this.state = {
      onSelectText: "", // 当前滑动位置标识文案
      isShowSelectText: false, // 是否展示文案
      dataKeys: dataKeys,
      noniusKeys: noniusKeys,
      searchStatus: "unplayed",
      filteredCities: null,
      searchText:''
    };

    // 当前滑动字母位置
    this.onScrollIndex = 0;
    // 列表元素 DOM
    this.listTitleDom = [];
    // 检索区域总高度
    this.noniusEleHeight = 0;
    // 检索区域具体顶部高度
    this.noniusEleTop = 0;
  }

  componentDidMount() {
    if (this.props.data) {
      log("init success");

      const noniusEle = document.querySelector(`.${styles.nonius}`);
      const noniusEleChild = document.querySelector(
        `.${styles.nonius} > .${styles["keys-item"]}`
      );
      this.listTitleDom = document.querySelectorAll(
        `.${styles.section} > .${styles["title"]}`
      );
       
      this.noniusEleTop = noniusEle.getClientRects()[0].top;
      //console.log("this.noniusEleTop ",this.noniusEleTop )
      this.noniusEleHeight = noniusEleChild.clientHeight;

      // 单独声明 touchmove 事件，解决页面滚动问题
      document.querySelector(`.${styles.nonius}`).addEventListener(
        "touchmove",
        (e) => {
          this.sidebarTouchMove(e);
        },
        {
          passive: false, // react 绑定事件默认为 true
        }
      );
    }
  }

  componentDidUpdate(){
    if(this.state.searchStatus === 'completed'){
      document.querySelector('body').style.overflow = 'hidden'
    }else{
      document.querySelector('body').style.overflow = 'auto'
    }
  }
  // 游标位置合法检测
  onScrollIndexCheck() {
    this.onScrollIndex = parseInt(
      (this.scrollEleTop - this.noniusEleTop) / this.noniusEleHeight,
      10
    );
  

    if (this.onScrollIndex < 0) {
      this.onScrollIndex = 0;
    }

    if (this.onScrollIndex >= this.listTitleDom.length - 1) {
      this.onScrollIndex = this.listTitleDom.length - 1;
    }
  }

  // 开始滑动字母检索区域
  sidebarTouchStart(e) {
    this.scrollEleTop = e.touches[0].clientY;
    this.onScrollIndexCheck();
    this.setState({
      isShowSelectText: true,
      onSelectText: this.state.noniusKeys[this.onScrollIndex],
    });
  }

  // 正在滑动字母检索区域
  sidebarTouchMove(e) {
    e.preventDefault();
    this.scrollEleTop = e.touches[0].clientY;
    this.onScrollIndexCheck();
    this.setState({
      isShowSelectText: true,
      onSelectText: this.state.noniusKeys[this.onScrollIndex],
    });
  }

  // 滑动字母检索区域结束，处理列表跳转
  sidebarTouchEnd(e) {
    this.setState({
      isShowSelectText: false,
    });

    this.onScrollIndexCheck();
    const target = this.listTitleDom[this.onScrollIndex];
    let searchBox = this.searchRef.current

    if(e.target.id === '0'){
      window.scrollTo(0, 0);
      return
    }
    window.scrollTo(0, target.offsetTop - searchBox.offsetHeight);
  }

  configAttr(key, attr) {
    let res = null;

    if (key == "pos") {
      return this.props.config[key].title;
    }

    if (this.props.config) {
      return this.props.config[key] && this.props.config[key][attr]
        ? this.props.config[key][attr]
        : null;
    }

    return res;
  }

  configAttrImg(key, attr) {
    let res = null;
    if (this.props.config) {
      res =
        this.props.config[key] && this.props.config[key][attr] ? (
          <img src={this.props.config[key][attr]} alt="" />
        ) : null;
    }
    return res;
  }

  renderCities(sec,recentVisit) {
    const { location } = this.props.config;
    const { data } = this.props;
    const city = isCityNull(location.value);
    if (sec === "pos") {
      return (
       
        <React.Fragment>
          <div
            className={styles.current}
            onClick={
              city
                ? this.props.onSelectItem.bind(this, city)
                : this.props.onSelectItem.bind(this, {
                    name: location.value,
                    id: "999999",
                  })
            }
          >
            { location.value ? (
              city ? (
                <React.Fragment><img src={iconSrc} alt="" /><span>当前定位城市 {city.name}</span></React.Fragment>
              ) : (
                <React.Fragment><img src={iconSrc} alt="" /> <span>当前定位城市 {location.value}</span></React.Fragment>
              )
            ) : (
              <span className={styles.reload} onClick={this.props.refreshAction}><img src={reloadIcon}/>定位失败，点击重试</span>  
            )}
          </div>
         
        </React.Fragment>
      );
    } else {
      if (data[sec]) {
        return data[sec].map((item, itemIndex) => (
          <div
            onClick={this.props.onSelectItem.bind(this, item)}
            key={itemIndex}
          >
            {item.name}
          </div>
        ));
      }
    }
  }

  handleFilter(value) {
    let keys = Object.keys(data.indexCitys);
    let finalKeys = keys.slice(2);
    let retArr = [];
    console.log("value", value);
    finalKeys.map((child) => {
      let sub = data.indexCitys[child];
      if (sub && sub.length > 0) {
        sub.map((item) => {
          if (item.name.includes(value)) {
            retArr.push(item);
          }
        });
      }
    });
    this.setState({
      searchStatus: "completed",
      filteredCities: retArr,
      searchText:value
    });
    // for (const child of data.indexCitys[finalKeys]){
    //   console.log("item",child)
    // }
  }

  // handleChange(){
  // e.persist()
  //React 涉及e.target时候，使用debounce节流函数
  //https://segmentfault.com/a/1190000020156100
  //https://blog.logrocket.com/how-and-when-to-debounce-or-throttle-in-react/

  // const debouncedFilter = debounce(() => {
  //   let val = e.target.value
  //   if(val){
  //     _self.handleFilter(val)
  //   }

  // }, 300)
  // debouncedFilter()
  // }

  changeHandler() {
    if (this.gref.current) {
      let val = this.gref.current.value;
      if (!val) {
        this.setState({
          searchStatus: "unplayed",
        });
        return;
      }
      this.handleFilter(val);
    }
  }
  handleSelect(item) {
    this.props.onSelectItem(item);
  }

  handleClear() {
    this.gref.current.value = "";
    this.setState({
      filteredCities: [],
      searchText:'',
      searchStatus: "unplayed",
    });

  }

  renderCecentCities(cities){
    if(!cities || cities.length <= 0){
      return null
    }
    return <div className={styles.currentCities}><div className={styles.section}>
            <h3 className={styles.ititle}>最近访问城市</h3>
            <div className={styles.box + " " +styles['grid']}>
              {
                cities.map((item,index)=><div onClick={()=>this.props.onSelectItem(item)} key={index}>{item.name}</div>)
              }
            </div>
          </div>

          </div>
  }

  render() {
    if (!this.props.data) return false;
    const { filteredCities, searchStatus ,searchText } = this.state;
    const { recentVisit  } = this.props

    return (
      <React.Fragment>

        {/* 搜索 */}
        <div
          className={[
            styles.search,
            searchStatus == "completed" ? styles.active : "",
          ].join(" ")}
        >
          <div className={styles.section} ref={this.searchRef}>
            <div className={styles.input}>
              <i></i>
              <input
                type="input"
                ref={this.gref}
                onChange={debounce(this.changeHandler, 400)}
                placeholder="输入城市名查询"
              />
              {
                searchText  && <em onClick={this.handleClear}></em>
              }
              
            </div>
          </div>
          <div className={styles["search-result"]}>
            <ul>
              {
                // this.props.onSelectItem.bind(this, item)
                filteredCities &&
                  filteredCities.map((item, index) => {
                    return (
                      <li
                        key={`filteredCities-${index}`}
                        onClick={() => this.handleSelect(item)}
                      >
                        {item.name}
                      </li>
                    );
                  })
              }
            </ul>

            {searchStatus == "completed" && filteredCities.length == 0 && (
              <div className={styles["no-data"]}>
                暂无该城市的相关信息，请试试其他城市
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.placeholder}></div>
       {
           this.renderCecentCities(recentVisit)
        }
        <div className={styles.clSearchComponent}>
          {/* 检索游标 */}
          <div
            className={styles["nonius"]}
            onTouchStart={this.sidebarTouchStart.bind(this)}
            onTouchEnd={this.sidebarTouchEnd.bind(this)}
          >
            {/* 检索游标键值列表 */}
            {this.state.dataKeys.map((secKey, secIndex) => (
              <div className={styles["keys-item"]} key={secIndex} id={secIndex}>
                {this.configAttrImg(secKey, "icon") ||
                  this.configAttr(secKey, "key") ||
                  this.configAttr(secKey, "title") ||
                  secKey}
              </div>
            ))}
          </div>

          {/* 滑动选中标识 */}
          {this.state.isShowSelectText ? (
            <div className={styles["on-select"]}>{this.state.onSelectText}</div>
          ) : null}


        {/* 最近访问的城市 */}

          {/* 数据列表 */}
          <div>
            {Object.keys(this.props.data).map((sec, secIndex) => (
              <div className={styles.section} id={secIndex} key={secIndex}>
                {sec == "pos" ? null : (
                  <div
                    className={[
                      styles.title,
                      sec === "hot" ? styles.hot : " ",
                    ].join(" ")}
                  >
                    {this.configAttr(sec, "title") || sec}
                  </div>
                )}

                <div
                  className={
                    styles.box +
                    " " +
                    (styles[this.configAttr(sec, "style")] || styles["line"])
                  }
                >
                  {this.renderCities(sec,recentVisit)}
                </div>
              </div>
            ))}
          </div>
        </div>
         
      </React.Fragment>
    );
  }
}

// 默认Props
CitySelect.defaultProps = {
  data: data.indexCitys,
  config: {
    pos: {
      icon: iconSrc,
      title: "顶部",
    },
    hot: {
      title: "热门城市",
      key: "热门",
      style: "grid",
    },
  },
};

// 类型检查
CitySelect.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
  onSelectItem: PropTypes.func.isRequired,
  recentVisit: PropTypes.array
};
