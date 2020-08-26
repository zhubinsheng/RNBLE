import {PermissionsAndroid, ToastAndroid }from 'react-native';

/**

 * Toast  显示提示

 * @param data 显示的内容 string

 * @private

 */

export const _show = (data) => {

    ToastAndroid.show(data, ToastAndroid.SHORT);

};

/**

 * Android 权限检查  第一步

 */

export const checkPermission = async (permission) => {
    try {

//返回Promise类型 异步函数 await --> 等待异步函数完成 --> 获取到返回值

        const granted =await PermissionsAndroid.check(permission);

        // 返回 异步函数 得到的值

        return granted;

    }catch (err) {

        this._show(err.toString());

        return false;

    }

};

/**

 * 权限请求  第二部

 * @param permissions 权限数组/具体权限

 * @returns {Promise}

 */

export const requestMultiplePermission =async (permissions) => {

    try {

// const permissions = [

//  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,

//  PermissionsAndroid.PERMISSIONS.CAMERA];

        const granted =await PermissionsAndroid.requestMultiple(permissions);

        // if (granted['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted') {} else {}

        return granted;

    }catch (err) {

        this._show(err.toString());

        return null;

    }

};

/**

 * 危险权限 --> 需要用户手动授权

 */

export const permission = {

// 联系人

    WRITE_CONTACTS:PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,

    GET_ACCOUNTS:PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS,

    READ_CONTACTS:PermissionsAndroid.PERMISSIONS.READ_CONTACTS,

    // 打电话

    READ_CALL_LOG:PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,

    READ_PHONE_STATE:PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,

    CALL_PHONE:PermissionsAndroid.PERMISSIONS.CALL_PHONE,

    WRITE_CALL_LOG:PermissionsAndroid.PERMISSIONS.WRITE_CALL_LOG,

    USE_SIP:PermissionsAndroid.PERMISSIONS.USE_SIP,

    PROCESS_OUTGOING_CALLS:PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,

    ADD_VOICEMAIL:PermissionsAndroid.PERMISSIONS.ADD_VOICEMAIL,

    // 日历

    READ_CALENDAR:PermissionsAndroid.PERMISSIONS.READ_CALENDAR,

    WRITE_CALENDAR:PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,

    // 照相机

    CAMERA:PermissionsAndroid.PERMISSIONS.CAMERA,

    // 传感器

    BODY_SENSORS:PermissionsAndroid.PERMISSIONS.BODY_SENSORS,

    // 定位

    ACCESS_FINE_LOCATION:PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,

    ACCESS_COARSE_LOCATION:PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,

    // 存储

    READ_EXTERNAL_STORAGE:PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,

    WRITE_EXTERNAL_STORAGE:PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,

    // 麦克风

    RECORD_AUDIO:PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,

    // 短信

    READ_SMS:PermissionsAndroid.PERMISSIONS.READ_SMS,

    RECEIVE_WAP_PUSH:PermissionsAndroid.PERMISSIONS.RECEIVE_WAP_PUSH,

    RECEIVE_MMS:PermissionsAndroid.PERMISSIONS.RECEIVE_MMS,

    RECEIVE_SMS:PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,

    SEND_SMS:PermissionsAndroid.PERMISSIONS.SEND_SMS,

    READ_CELL_BROADCASTS:PermissionsAndroid.PERMISSIONS.READ_CELL_BROADCASTS


};

/*

下面是危险权限

group:android.permission-group.CONTACTS

permission:android.permission.WRITE_CONTACTS

permission:android.permission.GET_ACCOUNTS

permission:android.permission.READ_CONTACTS

group:android.permission-group.PHONE

permission:android.permission.READ_CALL_LOG

permission:android.permission.READ_PHONE_STATE

permission:android.permission.CALL_PHONE

permission:android.permission.WRITE_CALL_LOG

permission:android.permission.USE_SIP

permission:android.permission.PROCESS_OUTGOING_CALLS

permission:com.android.voicemail.permission.ADD_VOICEMAIL

group:android.permission-group.CALENDAR

permission:android.permission.READ_CALENDAR

permission:android.permission.WRITE_CALENDAR

group:android.permission-group.CAMERA

permission:android.permission.CAMERA

group:android.permission-group.SENSORS

permission:android.permission.BODY_SENSORS



group:android.permission-group.STORAGE

permission:android.permission.READ_EXTERNAL_STORAGE

permission:android.permission.WRITE_EXTERNAL_STORAGE

group:android.permission-group.MICROPHONE

permission:android.permission.RECORD_AUDIO

group:android.permission-group.SMS

permission:android.permission.READ_SMS

permission:android.permission.RECEIVE_WAP_PUSH

permission:android.permission.RECEIVE_MMS

permission:android.permission.RECEIVE_SMS

permission:android.permission.SEND_SMS

permission:android.permission.READ_CELL_BROADCASTS

*/
