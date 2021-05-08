const express = require('express');
// const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const fs = require('fs');
const sharp = require('sharp')
var { isNull, last } = require('lodash')
var request = require('request');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const lodashId = require('lodash-id')
const delay = require('delay')


const app = express();
const PORT = process.env.PORT || 5000

var adapter = new FileSync('db.json')
var db = low(adapter)
db._.mixin(lodashId)
db.defaults({
    requests:[]
}).write()

app.use('/uploads', express.static('uploads'))

filepath  = function(last = '',post){
    return ( post.owner?.username || post.owner?.id || 'nill' ) + '_' + ( post.shortcode || post.id || post.__typename ) + ( last ? '_' + last : '' ) + '.jpg';
};
async function download(uri, filename = 'uploads', callback = function(file){console.log(file);}){
    return new Promise(async function(resolve) { 
        if( fs.existsSync(filename) ) resolve(filename);
        await request.head(uri, async function(err, res, body){
            await request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
            resolve(filename);
        });
    })
}

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.get('/', function(req, res){
    res.send('Hello Herokuapp');
})
app.get('/uploads', function(req, res){
    var filenames = fs.readdirSync('./uploads/');
    var output = '<ol>';
    filenames.map(el => {
        output += `<li><a href="./${el}" target="_blank">${el}</a></li>`;
    })
    output    += '</ol>';
    res.send(output)
})
app.post('/createstory', async function (req, res, next) {

    console.log();
    var post = req.body;
    // console.log('post', post);
    var output = {
        story: filepath('story', post),
        feed: filepath('feed', post)
    };
    var fileurl = last(post?.display_resources)?.src
    console.log('fileurl', fileurl.length);

    try {

        var file =  './uploads/' + ( post.shortcode || post.id || post.__typename ) + '.jpg';
        
        await download(fileurl, file, async function(){

            await delay( 3 * 1000);
            // creating for story
            sharp(file).resize(1080).toBuffer().then( async butter => {
                var finaloutput = await sharp({
                    create: {
                        width: 1080,
                        height: 1920,
                        channels: 4,
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    }
                })
                .flatten( { background: '#ffffff' } )
                .composite([{ input: butter }])
                .sharpen().withMetadata().toFile( 'uploads/' + output.story);
            });
            await delay( 1 * 1000);
            // creating for feed
            sharp(file).resize(null, 1080).toBuffer().then( async feedbutter => {
                var feedfinaloutput = await sharp({
                    create: {
                        width: 1080,
                        height: 1080,
                        channels: 4,
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    }
                })
                .flatten( { background: '#ffffff' } )
                .composite([{ input: feedbutter }])
                .sharpen().withMetadata().toFile( 'uploads/' + output.feed);
            });
            await delay( .5 * 1000);
        })

        post.output = output;
        post.file   = file;
        var adapter = new FileSync('db.json')
        var db = low(adapter)
        db._.mixin(lodashId)
        db.get('requests').push(post).write();
        
        res.json(output);

        // console.log('responed, delete extra photos');
        // var del_requests= db.get('requests').reverse().value()
        // if(del_requests.length > 2) {
        //     for (let e = 2; e < del_requests.length; e++) {
        //         const el = del_requests[e];
        //         // console.log(el.owner.username, el.output );
        //         await fs.existsSync(post.file) && await fs.unlinkSync(post.file);
        //         await fs.existsSync('./uploads/' + el.output.story) && await fs.unlinkSync('./uploads/' + el.output.story);
        //         await fs.existsSync('./uploads/' + el.output.feed)  && await fs.unlinkSync('./uploads/' + el.output.feed);
        //         db.get('requests').remove({ id: post.id });
        //         db.get('requests').remove({ unique: post.unique });
        //     }
        // }
        // db.write();

        return;
        
    } catch (error) {
        console.log('shorp', error);
    }

    res.json(output);

})

app.listen(PORT, function() {
  console.log('Express server listening on port ', PORT); // eslint-disable-line
});
