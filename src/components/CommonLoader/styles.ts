import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    margin: 0,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  loaderView:{
    width:'15%',
    height:'8%',
    backgroundColor:'white',
    borderRadius:10,
    justifyContent:'center',
    alignItems:'center'
  }
});

export default styles;
