$(document).ready(function () {
    var dataURL = "https://raw.githubusercontent.com/marmelab/EventDrops/master/demo/data.json";
    $.getJSON(dataURL, function (data) {
        var lineHeight = 40;
        var dataLen = data.length;

        //paint
        var $svg = $("svg"),
            width = +$svg.attr("width");
        $svg.attr("height", 80 + dataLen * lineHeight);

        var $g = append($svg, "g")
            .attr("class", "viewport")
            .attr("transform", "translate(" + [10, 20] + ")");

        for (var i = 0; i < dataLen; i++) {
            var $gLine = append($g, "g")
                .attr("class", "drop-line")
                .attr("transform", "translate(0, " + lineHeight * i + ")");
            append($gLine, "line")
                .attr("class", "separator")
                .attr("x1", 200)
                .attr("x2", "100%")
                .attr("y1", lineHeight)
                .attr("y2", lineHeight);
            append($gLine, "g") // add filter defined in <defs>
                .attr("class", "drops line" + i)
                .attr("transform", "translate(200, 20)");
            append($gLine, "text")
                .attr("x", 180)
                .attr("y", 20)
                .attr("dy", "0.3em")
                .attr("text-anchor", "end")
                .text(data[i].name); //add number of events
        }

        var $gStart = append($g, "g")
            .attr("class", "bound start")
            .attr("transform", "translate(200, " + (20 + dataLen * 40) + ")");
        var $start = append($gStart, "text");

        var $gEnd = append($g, "g")
            .attr("class", "bound end")
            .attr("transform", "translate(200, " + (20 + dataLen * 40) + ")");
        var $end = append($gEnd, "text")
            .attr("x", 835)
            .attr("text-anchor", "end");

        var $gAxis = append($g, "g")
            .attr("class", "axis")
            .attr("transform", "translate(200, 0)")
            .attr("text-anchor", "middle");
        append($gAxis, "line")
            .attr("class", "domain")
            .attr("x1", 0)
            .attr("x2", "100%");
        //add ticks

        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"];
        var $gLines = $(".drop-line");
        var start = new Date("May 25 2017 16:1 +0000"),
            end = new Date("May 25 2018 16:1 +0000"),
            scale = initScale().domain([start, end]);
        update();

        //interact
        var $tooltip = $(".tooltip");

        //pan 
        var mouseDown = undefined;
        $svg.mousedown(function (evt) {
            mouseDown = { x: evt.pageX, start: start.getTime(), end: end.getTime() };
        });
        $svg.mouseup(function () {
            mouseDown = undefined;
        });
        $svg.mousemove(function (evt) {
            if (mouseDown !== undefined) {
                var dx = evt.pageX - mouseDown.x,
                    slope = scale.slope(),
                    dTime = dx / slope;
                start.setTime(mouseDown.start - dTime);
                end.setTime(mouseDown.end - dTime);
                scale.domain([start, end]);
                update();
            }
        });
        //zoom in and out
        var zoomRate = 1.25;
        $svg[0].onwheel = function (evt) {
            evt.preventDefault();
            var slope = scale.slope();
            if (evt.deltaY < 0) {
                slope *= zoomRate;
            }
            else {
                slope /= zoomRate;
            }
            scale.zoom(slope, evt.offsetX - 10 - 200);
            var scaleInverse = scale.inverse(),
                range = scale.range();
            start.setTime(scaleInverse(range[0]));
            end.setTime(scaleInverse(range[1]));
            update();
        }

        function update() {
            //axis
            

            //drops and counts
            var countAll = 0;
            data.forEach(function (repo, index) {
                var $g = $gLines.eq(index),
                    $gDrop = $(".drops", $g),
                    $text = $("text", $g);
                //drops
                $gDrop.html("");
                var count = 0;

                repo.commits.forEach(function (commit) {
                    var date = new Date(commit.date);
                    if (date >= start && date <= end) {
                        count++;
                        append($gDrop, "circle")
                            .attr("class", "drop")
                            .attr("cx", scale(date))
                            .attr("r", 5)
                            .mouseenter(function (evt) {
                                $tooltip
                                    .css("top", evt.pageY + 10 + "px")
                                    .css("left", evt.pageX - 20 + "px")
                                    .css("visibility", "unset");
                                var author = commit.author.name;
                                $(".avatar")
                                    .attr("src", "")
                                    .attr("alt", author)
                                    .attr("title", author);
                                $(".message").text(commit.message);
                                $(".author")
                                    .attr("href", "https://www.github.com/" + author)
                                    .text(author);
                                $(".date").text(date.toString().slice(4, 21));
                                $(".sha")
                                    .attr("href", commit.sha)
                                    .text(commit.sha.slice(0, 10));
                            })
                            .mouseleave(function () {
                                $tooltip
                                    .css("top", 0)
                                    .css("left", 0)
                                    .css("visibility", "hidden");
                            });
                    }
                });
                countAll += count;
                //counts
                $text.text(repo.name + " (" + count + ")");
            });
            //start and end
            $start.text(start.toDateString().slice(4));
            $end.text(end.toDateString().slice(4));
            //infos
            $("#numberCommits").text(countAll);
            $("#zoomStart").text(start.toString().slice(4, 21));
            $("#zoomEnd").text(end.toString().slice(4, 21));
        }

        function initScale() {
            var domain = [0, 1],
                range = [0, width - 10 - 200],
                k,
                b;
            function scale(date) {
                return k * date + b;
            }
            scale.domain = function (_) {
                return arguments.length ? (domain = _, init(), scale) : domain;
            }
            scale.range = function () {
                return range;
            }
            scale.slope = function () {
                return k;
            }
            scale.intercept = function () {
                return b;
            }
            scale.zoom = function (slope, anchorX) {
                var time = (anchorX - b) / k;
                k = slope;
                b = -k * time + anchorX;
            }
            scale.inverse = function () {
                return function (x) {
                    return (x - b) / k;
                }
            }
            return scale;

            function init() {
                k = (range[0] - range[1]) / (domain[0] - domain[1]);
                b = range[0] - k * domain[0];
            }
        }
    });
});

function append(parent, tag) {
    var elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
    $(parent).append(elem);
    return $(elem);
}