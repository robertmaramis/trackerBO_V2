var PROFILE="PROD",
SECRET="mitsui",
CODE="!@#$AppTracker*&^%",
HASH = CryptoJS.SHA1(CryptoJS.SHA1(SECRET)+CODE)+"",
AJAX_TIMEOUT_INT=60000,
AJAX_TIMEOUT="Failed connect to server, please try again later",
LOADING_MESSAGE="Please wait while your request is being process",
USER_EMAIL="",
USER_PASSWORD="",
USER_NAME="",
USER_BRANCH="",
LOGOUT_TIME="",
IDLE_TIME = 0,
LOGIN_FLAG = "",
IDLE_TIMEOUT = 19,
IDLE_TIME_INTERVAL = 20 * 60 * 1000;
GEO_TIME_FOREGROUND=1200000;

var idleInterval;

//ERROR MESSAGE
var
LOGIN_NAME_EMPTY="Please fill your user name",
LOGIN_PASSWORD_EMPTY="Please fill your user password",
GET_TRACK_NULL="No Data for this date",
AJAX_ERROR="Failed connect to server, please try again later";

if (PROFILE=="DEV") {
    var
    BASE_URL        ="http://114.4.147.113",
    LOGIN_URL       =BASE_URL+"/mitsui/index_dev.php/login",
    LOGOUT_URL      =BASE_URL+"/mitsui/index_dev.php/logout",
    GETMEMBER_URL   =BASE_URL+"/mitsui/index_dev.php/get_members",
    GET_TRACK_URL   =BASE_URL+"/mitsui/index_dev.php/get_track",
    GET_LOCATION    =BASE_URL+"/mitsui/index_dev.php/realtime_track";
} else {
    var
    BASE_URL        ="http://114.4.147.113",
    LOGIN_URL       =BASE_URL+"/mitsui/index.php/login",
    LOGOUT_URL      =BASE_URL+"/mitsui/index.php/logout",
    GETMEMBER_URL   =BASE_URL+"/mitsui/index.php/get_members",
    GET_TRACK_URL   =BASE_URL+"/mitsui/index.php/get_track",
    GET_LOCATION    =BASE_URL+"/mitsui/index.php/realtime_track";
}