var http = require('http');
var fs = require('fs');
var dateFormat = require('dateformat');

function fetchJson(index, next) {
	var fetchUrl = "http://septenary.cn/api/article/detail/" + index
	var request = http.get(fetchUrl, function (res) {

		const { statusCode } = res;
		const contentType = res.headers['content-type'];

		if (statusCode == 200) {
			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);
					var data = parsedData.data
					if (parsedData.data != null) {
						console.log(index + " result fetched: " + parsedData.data.author.name);

						var file = fs.createWriteStream('./source/_drafts/' + parsedData.data.author.name + "_" + parsedData.data.title.replace('/', '-') + ".md");

						// res.pipe(file);
						file.write('---')
						file.write('\n')

						file.write('title: ')
						file.write(data.title)
						file.write('\n')

						file.write('description:')
						file.write('\n')

						file.write('date: ')
						// file.write(new Date(data.createdTime).format('yyyy/MM/dd HH:MM:ss'))
						file.write(dateFormat(new Date(data.createdTime), "yyyy-mm-dd hh:MM:ss"))
						file.write('\n')

						file.write('category: ' + data.category)
						file.write('\n')

						file.write('tags:')
						data.tags.forEach(element => {
							file.write(' ' + element)
						});
						file.write('\n')

						file.write('comments:')
						file.write('\n')

						file.write('categories:')
						file.write('\n')

						file.write('permalink:')
						file.write('\n')

						file.write('---')
						file.write('\n\n\n')


						file.write(parsedData.data.content)

					} else {
						console.log(index + " result ignore: " + parsedData.data);
					}
				} catch (e) {
					console.error(index + " " + e.message);
				}
				next(++index)
			});

		} else if (statusCode == 404) {
			console.error(index + ' 未找到文章 ' + fetchUrl);
			// consume response data to free up memory
			res.resume();
			next(++index)
		} else {
			console.error(index + "Error " + statusCode + " " + fetchUrl);
			// consume response data to free up memory
			res.resume();
			next(++index)
		}
	});
}


function callback(index) {
	if (index < 2) {
		fetchJson(index, callback)
	}
}

callback(1)
