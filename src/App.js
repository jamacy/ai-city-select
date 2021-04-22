import React from "react";

// 引入 CitySelect 组件
import CitySelect from '../lib/index';
import iconLocation from '../lib/icon.png';


export default class APP extends React.Component {

  constructor() {
    super();
    this.state = {
       config: {
        pos: {
          icon: iconLocation, // 游标图标
          title: '当前',
          key: '当前',
        },
        location: {
          value:'成都市'
        },
        hot: {
          title: '热门城市',
          key: '热门',
          style: 'grid', 
        }
       }
    }
  }
  componentDidMount(){
    window.kara && window.kara.getCoordinate({
      appId: "2kjjtPu18vQtYGnk", 
      coordinateType: 1,
      success: (result)=> {

        console.log("result",result)
        let { city } = result
        const conf = Object.assign({},this.state.config)
        console.log("con=====>",conf)
        conf.location.value = city
        this.setState({
          config:conf
        });

      },fail:(err)=>{
        console.log(err)
      } 
    })
  }
  


  // 选中城市回调
  handleSelectCity(cityData) {
    console.log('选中数据项:', cityData);
  }

  render() {
    return (
      // 注册组件
      <CitySelect
        config={this.state.config}
        onSelectItem={this.handleSelectCity.bind(this)}>
      </CitySelect>
    )
  }

}