var fs = require('fs'),
	ztool = require('./ztool');

var readConfig = function(configFile){
	var content = fs.readFileSync(configFile).toString();
    var config = JSON.parse(content);
    //TODO 参数兼容
    return config;
}

var pickupJs = function(url){
	var content = fs.readFileSync(url).toString();
	var reg = /<script\s+.*?src="?([^"]+)"?[^>]+>/gi;
	var jss = [];
	content.replace(reg, function(m, u1){
		jss.push(u1);
	});
	// console.log(jss);
	return jss;
}

var pickupCss = function(url, manifest){
	var content = fs.readFileSync(url).toString();
	var maniReg = /(<html.+manifest="?)[^"]*("?[^>]*>)/i;
	if(maniReg.test(content)){
		content = content.replace(maniReg, '$1' + manifest + '$2');
	}else{
		var attr = ' manifest="' + manifest + '" '
		content = content.replace(/(<html)([^>]*>)/i, '$1' + attr + '$2');
	}
	fs.writeFileSync(url, content);
	var reg = /<link\s+.*?href="?([^"]+)"?[^>]+>/gi;
	var attReg = /rel="?\bstylesheet\b"?/i;
	var csss = [];
	content.replace(reg, function(m, u1){
		if(attReg.test(m)){
			csss.push(u1);
		}
	});
	// console.log(csss);
	return csss;
}

var pickupImg = function(url){
	url = url.split('?')[0];
	console.log(url);
	var content = fs.readFileSync(url).toString();
	var reg = /url\("?([^")]+)"\)/gi;
	var imgs = [];
	content.replace(reg, function(m, u1){
			imgs.push(u1);
	});
	console.log(imgs);
	return imgs;
}

var writeManifest = function(name, list, config){
	//write cache
	var record = [];
	record.push('CACHE MANIFEST');
	record.push('CACHE:');
	record = record.concat(list);
	//write network
	record.push('NETWORK:');
	record = record.concat(config.network);
	//write fallback
	record.push('FALLBACK:');
	record = record.concat(config.fallback);
	var content = record.join('\n');
	fs.writeFileSync(name, content);
}
/**
 * 合并数组，排除掉重复的
 * @param  {Array} origin 
 * @param  {Array} list   
 */
var mergeArray = function(origin, list){
	for(var i = 0, item; item = list[i]; i++) {
	    if(origin.indexOf(item) === -1){
	    	origin.push(item);
	    }
	}
}

/**
 * 入口函数
 * @param  {String} configFile 
 */
exports.generate = function(configFile){
	// 读取配置
	var config = readConfig(configFile);
	var cacheList = config.cache;
	var htmls, csss, jss, imgs, list, manifest;
	for(var name in cacheList){
		list = [];
		htmls = cacheList[name];
		manifest = name + '.' + config.manifestSuffix;
		for(var i = 0, html; html = htmls[i]; i++) {
			// 收集 html
			list.push(html);
			// 收集 js
			jss = pickupJs(html);
			mergeArray(list, jss);
			// 收集 css
			csss = pickupCss(html, manifest);
			mergeArray(list, csss);
			// 收集 css 里面的图片
			// for(var j = 0, css; css = csss[j]; j++) {
			// 	imgs = pickupImg(css.replace(config.linkPrefix, ''));
			//	mergeArray(list, imgs);
			// }
		}
		//创建 manifest 
		writeManifest(manifest, list, config);
	}
}