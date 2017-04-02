const modhash = window.reddit.modhash;

const TEMPLATE_URL = 'https://raw.githubusercontent.com/Rojoss/cfplace/master/cf_place_template.json';
const FETCH_INTERVAL = 300 * 1000; // [MS] Time between cache update in.

var template;
var index = 0;


function fetchTemplate() {
    console.info('Fetching latest version of the template...');
    fetch(TEMPLATE_URL).then((resp) => resp.json()).then(function (data) {
        // Cache template data
        template = data;

        // Random start index
        index = Math.floor(Math.random() * (template.colors[0].length * template.colors.length));

        console.info('Template has been updated!');
    }).catch(function (error) {
        console.error('Failed to fetch template!');
        console.error(error);
    });
}

function drawPixel(x, y, color) {
    // Fetch the pixel data
    $.get("https://www.reddit.com/api/place/pixel.json?x=" + x + "&y=" + y).then(res => {

        // Already correct color, move on to the next pixel
        if (res.color == color) {
            return draw(0);
        }

        // Try draw the pixel
        $.ajax({
            url: "https://www.reddit.com/api/place/draw.json", type: "POST",
            headers: { "x-modhash": modhash }, data: { x: x, y: y, color: color }
        }).done(data => {
            console.log('Pixel drawn at ' + x + ',' + y + '!');
            draw(data.wait_seconds);
            return;
        }).error(data => {
            console.error('Failed to draw pixel at ' + x + ',' + y + '! - Trying again in ' + data.responseJSON.wait_seconds + ' seconds.');
            draw(data.responseJSON.wait_seconds);
            return;
        });
    });
}

function draw(secondsDelay) {
    if (!template) {
        setTimeout(() => draw(0), 1000);
        return;
    }
    // Increment index to get a new coordinate
    var width = template.colors[0].length;
    var height = template.colors.length;
    index = (index + 1) % (width * height);

    // Get coordinates of pixel to draw
    const x = index % width;
    const y = Math.floor(index / width);

    const color = template.colors[y][x];

    // Ignored color, move on to the next pixel
    if (color == -1) {
        return draw(0);
    }

    const xx = template.startX + x;
    const yy = template.startY + y;

    // Try draw the pixel
    setTimeout(() => drawPixel(xx, yy, color), secondsDelay * 1000);
}

fetchTemplate();
window.setInterval(() => fetchTemplate(), FETCH_INTERVAL);
draw(0);