var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var zlib = require('zlib');
var express = require('express');
const { json, response } = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
var multer = require('multer');
var morgan = require ('morgan');
const replace = require('replace-in-file');
const sharp = require('sharp');
const axios = require('axios');
const puppeteer = require("puppeteer");

const formidable = require('./node_modules/formidable/lib/index.js');
var {exec,spawn} = require('child_process');
// const cp = require("child_process");
var FfmpegCommand = require('fluent-ffmpeg');
const { log } = require('console');
var app = express();
PORT = 8000;

app.use('/form', express.static(__dirname + '/index.html'));

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
//app.use(express.static(path.resolve('dist')));
app.use(express.static('public'))
var Storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, "../FmVideos");
	},
	filename: function(req, file, callback) {
		callback(null, file.originalname);
	}
});


var upload = multer({
	storage: Storage
}).array("imgUploader", 3); //Field name and max count



app.get('/Streams/*', function(req, res) {
	var uri = url.parse(req.url).pathname;
	console.log("uri == ",req.url);
	
	var filename = path.join("F://",uri);
	console.log('filename ==>'+filename);
	if (path.extname(filename) == ".m3u8" && false) {
		var uri2 = uri.replace('/Streams/', '');
			uri2 = uri2.replace('.m3u8', '_240p_002.ts');

		console.log("uri2 ************",uri2);

		const correctDNS = {
			files: filename,
			from: new RegExp("217.16.4.142", "g"),
			to: 'videosstreaming.furthermarket.com'
		};
		// var stringToReplace = "http://videosstreaming.furthermarket.com:8000/Streams/"+uri2;
		var stringToReplace = "http://videosstreaming.furthermarket.com:8000/Streams/"+uri2;
		console.log("stringToReplace ***",stringToReplace);
		console.log("uri2 ***",uri2);
		const correctSegment3 = {
			files: filename,
			from: new RegExp(stringToReplace, "g"),
			// to: uri2
			to: uri2
		};
		
		try {
			const resultsDNS = replace.sync(correctDNS);
			//console.log('Replacement results:', resultsDNS);

			const resultsSegment3 = replace.sync(correctSegment3);
			//console.log('Replacement results:', resultsSegment3);

		} catch (error) {
			console.log("Error to rename file for correct DNS :", error);
		}
	}
	
	/* var stringToReplace = "http://videosstreaming.furthermarket.com:8000/Streams/";
		//--- console.log("stringToReplace ***",stringToReplace);
		//--- console.log("uri2 ***",uri2);
		const initUri = {
			files: filename,
			from: new RegExp(stringToReplace, "g"),
			// to: uri2
			to: ''
		};
	try {
		const initializeUri = replace.sync(initUri);
	} catch (error) {
		console.log(error)
	} */

	 console.log("filename === "+filename);
	 //fs.existsSync(filename, function (exists) { 
		const exists = !!( fs.promises.stat(filename).catch(() => null))
		console.log('exists =>> '+exists);
		if (!exists) {
			// console.log('file not found: ' + filename);
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('file not found: %s\n', filename);
			res.end();
		} else {
			console.log('extname file: ' + path.extname(filename));
			console.log('fileName : ' + path.normalize(filename));
			switch (path.extname(filename)) {
			case '.m3u8':
				//filename = filename.replace(/\\/g,"\\\\");
				//filename = "F:\\Streams3\\Account_5014864_Thumb4_691.m3u8";
				
				filename = "F://Streams//Account_181957_Thumb4_2012.m3u8";
				//filename = String.raw`\\217.16.1.148\Streams\Account_181957_Thumb4_2012.m3u8`;
				console.log(filename);
				fs.readFile(filename, function (err, contents) {
					if (err) {
						console.log('error1 : ', err);
						// res.writeHead(500);
						res.end();
					} else if (contents) {

						// console.log('content : ', contents);
						// res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl'});
						var ae = req.headers['accept-encoding'];
						if (ae.match(/\bgzip\b/)) {
							zlib.gzip(contents, function (err, zip) {
								if (err) throw err;

								res.writeHead(200,
								    {'content-encoding': 'gzip'});
								res.end(zip);
							});
						} else {
							res.end(contents, 'utf-8');
						}
					} else {
						//--- console.log('emptly playlist');
						res.writeHead(500);
						res.end();
					}
				});
				break;
			case '.ts':
				// console.log('range : ',req.headers);
				
				
				res.writeHead(200, { 'Content-Type':
					'video/MP2T' });
					// MP2T MP2T
				var stream = fs.createReadStream(filename,
				    // { bufferSize: 64 * 1024 });
				    { highWaterMark: 150 * 1024 });
				stream.pipe(res);
				
				//--- console.log('***stream : sended');
				break;
			case '.mp4':
				// console.log('range : ',req.headers);
				res.writeHead(200, { 'Content-Type':
					'video/MP4' });
					// MP2T  
					//  ffmpeg -y -i a.mp4 -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -s 426X240 -c:v libx264 -b:v 365k -c:a copy -hls_time 2 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "fileSequence%d.m4s" prog_index.m3u8

				var stream = fs.createReadStream(filename,
				    { highWaterMark: 150 * 1024 });
				stream.pipe(res);
				break;
			case '.png':
				// console.log('range : ',req.headers);
				res.writeHead(200, { 'Content-Type':
					'image/png' });
					// MP2T  
					//  ffmpeg -y -i a.mp4 -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -s 426X240 -c:v libx264 -b:v 365k -c:a copy -hls_time 2 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "fileSequence%d.m4s" prog_index.m3u8

				var stream = fs.createReadStream(filename,
					{ highWaterMark: 150 * 1024 });
				stream.pipe(res);
				break;
			case '.m4s':
				// console.log('range : ',req.headers);
				res.writeHead(200, { 'Content-Type':
					'video/x-mpegURL' });
					// MP2T
				var stream = fs.createReadStream(filename,
				    { highWaterMark: 150 * 1024 });
				stream.pipe(res);
				break;
			default:
				console.log('unknown file type: ' +
				    path.extname(filename));
				res.writeHead(500);
				res.end();
			}
		}
	 //}); 
})
app.get('/resizepicture', function(req, res) {
	var tempFileName = Math.random().toString(36).substr(2, 5);
		tempFileName += '.jpg';
	var sharpFileName = Math.random().toString(36).substr(2, 5);
		sharpFileName += '.jpg';

	var sharpOutput = "C:\\FmVideoStreamerServerNew\\tempFiles\\"+sharpFileName

	var inputuri ="C:\\FmVideoStreamerServerNew\\tempFiles\\"+tempFileName;
	const localTempFile = "/mnt/c/FmVideoStreamerServerNew/tempFiles/"+tempFileName;
	var bashEntriFile = `/mnt/f/`+req.query.inputuri; 
	var outputuri = `/mnt/f/`+req.query.outputuri;
	var imagewidth = parseInt(req.query.imagewidth);
	var imageheight = parseInt(req.query.imageheight);

	console.log("localTempFile "+localTempFile);
	console.log("bashEntriFile "+bashEntriFile);
	
	console.log('resizepicture');
	console.log('inputuri: '+inputuri);
	console.log('outputuri: '+outputuri);

	const shellCopyFile = exec(`bash ./bashFile/copyFile.sh ` + bashEntriFile+` `+localTempFile);
	//  shellCopyFile.stdout.on('data', d => console.log(`stdout info: ${d}`));
	//  shellCopyFile.stderr.on('data', d => console.log(`stderr error: ${d}`));
	//  shellCopyFile.on('error', d => console.log(`**error: ${d}`));
	shellCopyFile.on('close', code => {
		console.log(`bash copy file 1 : child process ended with code ${code}`);

		const roundedCorners = Buffer.from(
			'<svg><rect  x="0" y="0" width="'+imagewidth+'" height="'+imageheight+'" rx="100" ry="100"/></svg>'
		);   
		
		sharp(inputuri)
		.resize(imagewidth+100,imageheight+100)
		//   .rotate(180)
		//   .flatten( { background: '#ffffff' } )
		.sharpen()
		// .withMetadata()
		.png( { quality: 100 } )
		.toBuffer()
		.then(data => sharp(data)
			.composite([{ input: roundedCorners,blend: 'dest-in'}])
			.toFile(sharpOutput,
			err =>{
				console.log('err: 1 1 1 => '+err);

				

				bashEntriFile = "/mnt/c/FmVideoStreamerServerNew/tempFiles/"+sharpFileName;

				const shellCopyFile2 = exec(`bash ./bashFile/copyFile.sh ` + bashEntriFile+` `+outputuri);
				/* shellCopyFile2.stdout.on('data', d => console.log(`stdout info: ${d}`));
				shellCopyFile2.stderr.on('data', d => console.log(`stderr error: ${d}`));
				shellCopyFile2.on('error', d => console.log(`**error: ${d}`)); */
				shellCopyFile2.on('close', code => {
					console.log(`bash copy file 2 2: child process ended with code ${code}`);
					
					const shellDeleteFile1 = exec(`bash ./bashFile/deleteFile.sh ` + localTempFile);
					const shellDeleteFile2 = exec(`bash ./bashFile/deleteFile.sh ` + bashEntriFile);

					res.end("success");
				});
			},
			success =>{
				console.log('Sharp success: ');
				res.end("success");
			}
			)
		).catch(err=>{console.log(' error resizepicture==>'+err);res.end("success")});
	});
});

app.post('/htmltoimage', function(req, res) {
	
	var data = req.body;
	console.log('----------', data);

/* 	const fs = require("fs");

	fs.writeFile('C:/Users/Gamorax/Desktop/Images/file.txt', JSON.stringify(data), function(err) {

		 if (err) {
			 msgLog = '=> writing result Error: '+err.toString(); 
			 console.log(msgLog);
			 return;
		 }else{
			console.log(' Success !!!');
		 }
	}); */

	if (!data) {
		responseData.Status = 'False';
		responseData.Message = 'No data received !';

		res.end(JSON.stringify(responseData));
	}

	var responseData = new Object();

	pageEvelueta(data);	
   
	async function pageEvelueta(data) {

		if (!data) {
			responseData.Status = 'False';
			responseData.Message = 'An error occured !';

			res.end(JSON.stringify(responseData));
		}

		const customArgs = [
			'--disable-web-security',
			'--window-size=1920,1080',
		  ];
		var options = {
						headless: false,
						args: ['--window-size=1920,1080'],
						defaultViewport: null
					}
		const browser = await puppeteer.launch(options);
		const page = await browser.newPage();

		await page.goto(
			"http://127.0.0.1:8000/"
			, {waitUntil: 'networkidle0'}
		).catch(err=>console.log(err));
		await page.waitForSelector(".main").catch(err=>console.log(err));
		
		const screenshot = await page.evaluate(async ({data:data}) => {
			try {
				imageParent = document.getElementById("imageParent");
				imageParent.style = data.imageParentStyle;

				console.log('-----111-----', data.imageParentStyle);

				headerText = document.getElementById("headerText");
				headerText.textContent           = data.headerText;
				// headerText.style.color           = data.headerTextColor;       
				// headerText.style.fontFamily      = data.headerTextFontFamily;
				headerText.style		         = data.headerStyle;

				bodyText = document.getElementById("bodyText"); 
				bodyText.textContent           = data.bodyText;
				// bodyText.style.color           = data.textColor;       
				// bodyText.style.fontFamily      = data.fontFamily;
				bodyText.style    				   = data.bodyStyle ;

				footerText = document.getElementById("footerText"); 
				footerText.textContent           = data.footerText;
				// footerText.style.color           = data.footerTextColor;       
				// footerText.style.fontFamily      = data.footerTextFontFamily;
				footerText.style 			     = data.footerStyle;

				/* 
				* Generate Image
				*/
				// imageParent.style.width = (zoomWidth)+'px';
				// imageParent.style.fontSize  = zoomHeight+'px';
				// imageParent.style.padding   = '0px';

				var canvas = await html2canvas(imageParent).catch(err=>console.log(err));
				var extra_canvas = document.createElement("canvas");
					// extra_canvas.setAttribute('width', imageParent.getBoundingClientRect().width);

					// extra_canvas.setAttribute('height', imageParent.getBoundingClientRect().height);
				
				var ctx = extra_canvas.getContext('2d');

					ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, imageParent.getBoundingClientRect().width, imageParent.getBoundingClientRect().height);
				var base64 = canvas.toDataURL("image/png");

				const img = new Image();
					img.style.margin = "0 auto";
					img.style.top = "15%";
					img.style.position = "absolute";
					img.src = base64;
					//--- console.log(base64);

				// document.body.appendChild(img);
					
				return base64;
			} catch (error) {
				console.log("evaluation error: ",error);
				// res.end("evaluation error");

				responseData.Status = 'False';
				responseData.Message = 'An error occured !';
	
				res.end(JSON.stringify(responseData));
				return ;
			}
		},
		{
			data:data
		})
		.then(screenshot => SharpImages(data, screenshot))
		.catch(err=>console.log(err));

		await browser.close();
	}

	async function SharpImages(data, screenshot, nbResult, imgRotation) {

		if(!screenshot || screenshot == "" ){

			console.log("---------- screenshot null ---------- Final ", data);

			responseData.Status = 'False';
			responseData.Message = 'An error occured !';

			res.end(JSON.stringify(responseData));
			return;
		}

		const b64OutName = Math.random().toString(36).substr(2, 5);
		const fleName    = b64OutName+'.png';
		if (screenshot.search("data:image/png;base64,")<0) {
			return;
		}

		const uri = screenshot.replace('data:image/png;base64,','');

		const destinationFolder = "C:\\Users\\Gamorax\\Desktop\\Images\\";
		const outputFile = destinationFolder + fleName;

		let imgBuffer =  Buffer.from(uri, 'base64');  
		sharp(imgBuffer)
					.rotate(imgRotation,{background: '#00000000'})
					.withMetadata()
					.toBuffer()
					.then(dataurl =>{
						sharp(dataurl)
							.toFile(outputFile,
								error =>{console.log("Sharp error")},
								success =>{ console.log("Shaerp success");}
							)

						responseData.Status     = 'True';
						responseData.Message    = 'image created successfully';
						responseData.OutputFile = outputFile;
						responseData.FleName    = fleName;

						console.log("-------- Final ",responseData);
						res.end(JSON.stringify(responseData));
						return;
					});
	}
	
})
app.get('/', function(req, res) {
	app.use(express.static(path.join(__dirname, '/htmlToImage/')));
    res.sendFile(path.join(__dirname,'/htmlToImage/css/'));
})
app.get('/dash_service', function(req, res) {
	// console.log("inputName: ",req.query.inputName);
	// console.log("outputName: ",req.query.outputName);

	const createHLSVOD = exec(`bash dashScript.sh /mnt/f/`+req.query.inputName+` /mnt/f/DashStreams `+req.query.outputName)
	
	//const createHLSVOD = exec(`bash dashScript.sh /mnt/f/`+req.query.inputName+` /mnt/f/DashStreams `+req.query.outputName)
	createHLSVOD.stdout.on('data', d => console.log(`stdout info: ${d}`));
	createHLSVOD.stderr.on('data', d => console.log(`stderr error: ${d}`));
	createHLSVOD.on('error', d => console.log(`**error: ${d}`));
	createHLSVOD.on('close', code => {console.log(`child process ended with code ${code}`) 
		res.send(JSON.stringify({success:'success'}));
	});
})

app.get('/segmentVideos', function(req, res) {
	console.log("in ffmpeg function");
	console.log("req.query.inputName : "+req.query.inputName);
	console.log("req.query.outputName : "+req.query.outputName);
	
	//const createHLSVOD = exec(`bash segmenter.sh /mnt/f/`+req.query.inputName+` `+req.query.outputName+` /mnt/f/OutputTest`);
	const createHLSVOD = exec(`bash segmenter.sh /mnt/f/`+req.query.inputName+` `+req.query.outputName+` /mnt/f/Streams`);
	createHLSVOD.stdout.on('data', d => console.log(`stdout info: ${d}`));
	createHLSVOD.stderr.on('data', d => console.log(`stderr error: ${d}`));
	createHLSVOD.on('error', d => console.log(`**error: ${d}`));
	createHLSVOD.on('close', code => {console.log(`child process ended with code ${code}`)
		res.send(JSON.stringify({success:'success'}));
	});

});

app.get('/videoOptimizer', function(req, res) {

	const createHLSVOD = exec(`bash videoOptimizer.sh `+req.query.inputName+` `+req.query.outputName+` `+req.query.destinationPath);
	createHLSVOD.stdout.on('data', d => console.log(`stdout info: ${d}`));
	createHLSVOD.stderr.on('data', d => console.log(`stderr error: ${d}`));
	createHLSVOD.on('error', d => console.log(`**error: ${d}`));
	createHLSVOD.on('close', code => {console.log(`child process ended with code ${code}`)
		res.send(JSON.stringify({success:'hello'}));
	});

});

// **********************************************   FOR TEST *********************************imagetamplate
app.get('/FmVideoStreams2/*', function(req, res) {
	var uri = url.parse(req.url).pathname;
	console.log("uri",uri);
	
	var filename = path.join("C:/",uri);
	
	console.log("filename",filename);
	fs.exists(filename, function (exists) {
		if (!exists) {
			// console.log('file not found: ' + filename);
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('file not found: %s\n', filename);
			res.end();
		} else {
			// console.log('sending file: ' + filename);
			switch (path.extname(filename)) {
			case '.m3u8':
				fs.readFile(filename, function (err, contents) {
					if (err) {
						// console.log('error1 : ', err);
						// res.writeHead(500);
						res.end();
					} else if (contents) {
						// console.log('content : ', contents);
						// res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl'});
						var ae = req.headers['accept-encoding'];
						if (ae.match(/\bgzip\b/)) {
							zlib.gzip(contents, function (err, zip) {
								if (err) throw err;

								res.writeHead(200,
								    {'content-encoding': 'gzip'});
								res.end(zip);
							});
						} else {
							res.end(contents, 'utf-8');
						}
					} else {
						console.log('emptly playlist');
						res.writeHead(500);
						res.end();
					}
				});
				break;
			case '.ts':
				// console.log('range : ',req.headers);
				res.writeHead(200, { 'Content-Type':
					'video/MP4' });
					// MP2T
				var stream = fs.createReadStream(filename,
				    { bufferSize: 64 * 1024 });
				stream.pipe(res);
				break;
			case '.mp4':
				// console.log('range : ',req.headers);
				res.writeHead(200, { 'Content-Type':
					'video/MP4' });
					// MP2T
				var stream = fs.createReadStream(filename,
				    { bufferSize: 64 * 1024 });
				stream.pipe(res);
				break;
			case '.m4s':
				// console.log('range : ',req.headers);
				res.writeHead(200, { 'Content-Type':
					'video/x-mpegURL' });
					// MP2T
				var stream = fs.createReadStream(filename,
				    { bufferSize: 64 * 1024 });
				stream.pipe(res);
				break;
			default:
				console.log('unknown file type: ' +
				    path.extname(filename));
				res.writeHead(500);
				res.end();
			}
		}
	});
})

app.get("/ss", function(req, res) {
	res.writeHead(200, { 'content-type': 'text/html' });
	res.end(`
	  <h2>With Node.js <code>"http"</code> module2</h2>
	  <form action="http://videosstreaming.furthermarket.com:8000/api/Upload" enctype="multipart/form-data" method="post">
		
		<div>File: <input type="file" name="imgUploader" multiple="multiple" /></div>
		<input type="submit" value="Upload" />
	  </form>
	`);
});

app.post("/api/Upload",function(req, res) {

	upload(req, res, function(err) {
		if (err) { 
			return res.end("Something went wrong!");
		}
		
		if (! req.files[0].originalname) { 
			return res.end("Something went wrong!");
		}
		
		console.log(req.files);
		console.log("in ffmpeg function");
		var tsName = req.files[0].originalname;
		tsName = tsName.split('.');
		if (tsName.length>1) {
			tsName = tsName[0];
		}
		console.log("name : ",tsName);
		// const exec = require('child_process').exec;
		const createHLSVOD = exec(`bash create-hls-vod.sh ../FmVideos/`+req.files[0].originalname+` `+tsName+` /FmVideoStreams`);
		// cost createHLSVOD = exec(`bash HLS-Stream-Creator.sh -i ../FmVideos/Account_`+req.query.accountid+`_thumb4_`+req.query.imageid+`.mp4 -s 10 -b 128-600x400,256-1280x720,2000`);
		
		// const createHLSVOD = spawn(`bash`, [`create-hls-vod.sh`,`/mnt/c/FmVideos/Account_`+req.query.accountid+`_thumb4_`+req.query.imageid+`.mp4`,` Account_`+req.query.accountid+`_thumb4_`+req.query.imageid,`/FmVideoStreams`]);  
		createHLSVOD.stdout.on('data', d => console.log(`stdout info: ${d}`));
		createHLSVOD.stderr.on('data', d => console.log(`stderr error: ${d}`));
		createHLSVOD.on('error', d => console.log(`**error: ${d}`));
		createHLSVOD.on('close', code => {console.log(`child process ended with code ${code}`) 
			res.send(JSON.stringify({success:'success'}));
		});
	});
	
});

app.get("/modifyFile", function(req, res) {
	var target = req.query.target;
	console.log('target',target);
	res.end(JSON.stringify({Replacement :'en cour'}));
 	const options = {
		files: 'F://Streams/'+target+'.m3u8',
		from: new RegExp(target, "g"),
		to: 'http://videosstreaming.furthermarket.com:8000/Streams/'+target
	};
	
	const options2 = {
		files: 'F://Streams/'+target+'.m3u8',
		from: 'http://videosstreaming.furthermarket.com:8000/Streams/',
		to: ''
	};
	
 	/* const options3 = {  /Streams/Account_929327_Thumb4_105_240p_000.ts
		files: 'F://Streams/'+target+'.m3u8',
		from: new RegExp(target, "g"),
		to: 'http://videosstreaming.furthermarket.com:8000/Streams/'+target
	}; */
	/* const options3 = {
		files: 'F://Streams/'+target+'.m3u8',
		from: 'http://videosstreaming.furthermarket.com:8000/Streams/',
		to: ''
	}; */
	
	try {
		const results = replace.sync(options);
		//console.log('Replacement results:', results);
			
		const results2 = replace.sync(options2);
		//console.log('Replacement results:', results2);
		
		const results3 = replace.sync(options2);
		//console.log('Replacement results:', results3);
		
		const results4 = replace.sync(options2);
		//console.log('Replacement results:', results4);

	}
	catch (error) {
		console.error('Error occurred:', error);
	}
	
	/* try {	
		const results4 = replace.sync(options3);
		console.log('Replacement results:', results4);
		return;
	}
	catch (error) {
		console.error('Error occurred:', error);
	} */

	});

app.post("/api/Upload2",function(req, res) {

	upload(req, res, function(err) {
		if (err) { 
			return res.end("Something went wrong!");
		}
		
		if (!req.files[0].originalname) { 
			return res.end("Something went wrong!");
		}
		
		console.log(req.files);
		console.log("in ffmpeg function");
		var tsName = req.files[0].originalname;
		// tsName = tsName.slice('.')[0];
		tsName = tsName.split('.');
		if (tsName.length>1) {
			tsName = tsName[0];
		}
		console.log("name : ",tsName);
		// const exec = require('child_process').exec;
		const createHLSVOD = exec(`bash create-hls-vod-simple.sh ../FmVideos/`+req.files[0].originalname+` ../FmVideoStreams2/`+tsName);
		// cost createHLSVOD = exec(`bash HLS-Stream-Creator.sh -i ../FmVideos/Account_`+req.query.accountid+`_thumb4_`+req.query.imageid+`.mp4 -s 10 -b 128-600x400,256-1280x720,2000`);
		
		// const createHLSVOD = spawn(`bash`, [`create-hls-vod.sh`,`/mnt/c/FmVideos/Account_`+req.query.accountid+`_thumb4_`+req.query.imageid+`.mp4`,` Account_`+req.query.accountid+`_thumb4_`+req.query.imageid,`/FmVideoStreams`]);  
		createHLSVOD.stdout.on('data', d => console.log(`stdout info: ${d}`));
		createHLSVOD.stderr.on('data', d => console.log(`stderr error: ${d}`));
		createHLSVOD.on('error', d => console.log(`**error: ${d}`));
		createHLSVOD.on('close', code => {console.log(`child process ended with code ${code}`) 
			res.send(JSON.stringify({success:'success'}));
		});
	});
	
});
app.listen(PORT, function () {
	console.log('Listening on port '+PORT+' !');
})
// ffmpeg -i a.mp4 -hls_list_size 0 c/output.m3u8

//ffmpeg -re -i "a.mp4" -y -c:v copy -c:a copy -hls_time 6 -hls_list_size 5 -hls_wrap 30 -start_number 1 "e/output.m3u8"










