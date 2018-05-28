$(document).ready(function () {
    let dataURL = "https://raw.githubusercontent.com/marmelab/EventDrops/master/demo/data.json";
    $.getJSON(dataURL, function (data) {
        let lineHeight = 40;
        let dataLen = data.length;

        //paint
        let $svg = $("svg"),
            width = +$svg.attr("width");
        $svg.attr("height", 80 + dataLen * lineHeight);

        let $g = append($svg, "g")
            .attr("class", "viewport")
            .attr("transform", "translate(" + [10, 20] + ")");

        for (let i = 0; i < dataLen; i++) {
            let $gLine = append($g, "g")
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

        let $gStart = append($g, "g")
            .attr("class", "bound start")
            .attr("transform", "translate(200, " + (20 + dataLen * 40) + ")");
        let $start = append($gStart, "text");

        let $gEnd = append($g, "g")
            .attr("class", "bound end")
            .attr("transform", "translate(200, " + (20 + dataLen * 40) + ")");
        let $end = append($gEnd, "text")
            .attr("x", 835)
            .attr("text-anchor", "end");

        let $gAxis = append($g, "g")
            .attr("class", "axis")
            .attr("transform", "translate(200, 0)")
            .attr("text-anchor", "middle");
        append($gAxis, "line")
            .attr("class", "domain")
            .attr("x1", 0)
            .attr("x2", "100%");
        let $gTicks = append($gAxis, "g");

        // let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
        //     "Sep", "Oct", "Nov", "Dec"],
        // monthsFull = ["January", "February", "March", "April", "May", "June", "July",
        //     "August", "September", "October", "November", "December"],
        // days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let monthsFull = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];
        let $gLines = $(".drop-line");
        let start = new Date("May 25 2017 16:1 +0000"),
            end = new Date("May 25 2018 16:1 +0000"),
            scale = initScale().domain([start, end]),
            interval = getInterval(),
            firstTick = getFirstTick();
        update();

        //interact
        let $tooltip = $(".tooltip");

        //pan 
        let mouseDown = undefined;
        $svg.mousedown(function (evt) {
            mouseDown = { x: evt.pageX, start: start.getTime(), end: end.getTime() };
        });
        $svg.mouseup(function () {
            mouseDown = undefined;
        });
        $svg.mousemove(function (evt) {
            if (mouseDown !== undefined) {
                let dx = evt.pageX - mouseDown.x,
                    slope = scale.slope(),
                    dTime = dx / slope;
                start.setTime(mouseDown.start - dTime);
                end.setTime(mouseDown.end - dTime);
                scale.domain([start, end]);
                firstTick = getFirstTick();
                update();
            }
        });
        //zoom in and out
        let zoomRate = 1.25;
        $svg[0].onwheel = function (evt) {
            evt.preventDefault();
            let slope = scale.slope();
            if (evt.deltaY < 0) {
                slope *= zoomRate;
            }
            else {
                slope /= zoomRate;
            }
            scale.zoom(slope, evt.offsetX - 10 - 200);
            let scaleInverse = scale.inverse(),
                range = scale.range();
            start.setTime(scaleInverse(range[0]));
            end.setTime(scaleInverse(range[1]));
            interval = getInterval();
            firstTick = getFirstTick();
            update();
        };

        function update() {
            //axis ticks
            //get interval based on start, end
            //from start, while tmp <= end, put a tick (vary), tmp += interval
            $gTicks.html("");
            let tick = firstTick,
                tickX;
            while (tick <= end) {
                tickX = scale(tick);
                let $gTick = append($gTicks, "g")
                    .attr("class", "tick")
                    .attr("transform", "translate(" + [tickX, 0] + ")");
                append($gTick, "line")
                    .attr("y2", -5);
                let $text = append($gTick, "text")
                    .attr("text-anchor", "middle")
                    .attr("y", -8)
                    .text(getTickLabel(tick));
                append($text, "title")
                    .text(tick.toString());
                tick["set" + interval.unit](tick["get" + interval.unit]() + interval.value);
            }

            //drops and counts
            let countAll = 0;
            data.forEach(function (repo, index) {
                let $g = $gLines.eq(index),
                    $gDrop = $(".drops", $g),
                    $text = $("text", $g);
                //drops
                $gDrop.html("");
                let count = 0;

                repo.commits.forEach(function (commit) {
                    let date = new Date(commit.date);
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
                                let author = commit.author.name;
                                $(".avatar")
                                    .attr("src", "") //?
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

            function getTickLabel(tick) {
                switch (interval.unit) {
                case "FullYear":
                    return getYearLabel();
                case "Month":
                    return getMonthLabel();
                case "Date":
                    return getDateLabel();
                case "Hours":
                    return getHourLabel();
                case "Minutes":
                    return getMinuteLabel();
                case "Seconds":
                    return getSecondLabel();
                case "Milliseconds":
                    return getMilliSecondLabel();
                default:
                    break;
                }

                function getYearLabel() {
                    return tick.getFullYear();
                }
                function getMonthLabel() {
                    let month = tick.getMonth();
                    if (month !== 0)
                        return monthsFull[month];
                    else
                        return getYearLabel();
                }
                function getDateLabel() {
                    let date = tick.getDate(),
                        day = tick.getDay(),
                        str = tick.toString();
                    if (date !== 1) {
                        if (interval.value >= 7 || day === 0) {
                            return tick.toDateString().slice(4, 10);
                        }
                        else {
                            return str.slice(0, 3) + " " + str.slice(8, 10);
                        }
                    }
                    else return getMonthLabel();
                }
                function getHourLabel() {
                    let hour = tick.getHours();
                    if (hour !== 0) {
                        if (hour < 12) {
                            return hour + " AM";
                        }
                        else if (hour === 12) {
                            return hour + " PM";
                        }
                        else {
                            return hour - 12 + " PM";
                        }
                    }
                    else return getDateLabel();
                }
                function getMinuteLabel() {
                    if (tick.getMinutes() !== 0) {
                        return tick.toTimeString().slice(0, 5);
                    }
                    else return getHourLabel();
                }
                function getSecondLabel() {
                    let second = tick.getSeconds();
                    if (second !== 0) {
                        return ":" + second;
                    }
                    else return getMinuteLabel();
                }
                function getMilliSecondLabel() {
                    let milli = tick.getMilliseconds();
                    if (milli !== 0) {
                        return milli;
                    }
                    else return getSecondLabel();
                }
            }
        }

        function initScale() {
            let domain = [0, 1],
                range = [0, width - 10 - 200],
                k,
                b;
            function scale(date) {
                return k * date + b;
            }
            scale.domain = function (_) {
                return arguments.length ? (domain = _, init(), scale) : domain;
            };
            scale.range = function () {
                return range;
            };
            scale.slope = function () {
                return k;
            };
            scale.intercept = function () {
                return b;
            };
            scale.zoom = function (slope, anchorX) {
                let time = (anchorX - b) / k;
                k = slope;
                b = -k * time + anchorX;
            };
            scale.inverse = function () {
                return function (x) {
                    return (x - b) / k;
                };
            };
            return scale;

            function init() {
                k = (range[0] - range[1]) / (domain[0] - domain[1]);
                b = range[0] - k * domain[0];
            }
        }

        function getInterval() {
            let second = 1000,
                minute = 60000,
                hour = 3600000,
                day = 86400000,
                month = 2592000000,
                year = 31536000000,
                millis = [
                    1, 2, 5, 10, 20, 50, 100, 200, 500,
                    1 * second, 5 * second, 15 * second, 30 * second,
                    1 * minute, 5 * minute, 15 * minute, 30 * minute,
                    1 * hour, 3 * hour, 6 * hour, 12 * hour,
                    1 * day, 2 * day, 7 * day,
                    1 * month, 3 * month, //
                    1 * year, 2 * year, 5 * year, 10 * year, 20 * year, 50 * year, //
                    100 * year, 200 * year, 500 * year, //
                    1000 * year, 2000 * year, 5000 * year //
                ],
                intervals = [
                    { value: 1, unit: "Milliseconds" },
                    { value: 2, unit: "Milliseconds" },
                    { value: 5, unit: "Milliseconds" },
                    { value: 10, unit: "Milliseconds" },
                    { value: 20, unit: "Milliseconds" },
                    { value: 50, unit: "Milliseconds" },
                    { value: 100, unit: "Milliseconds" },
                    { value: 200, unit: "Milliseconds" },
                    { value: 500, unit: "Milliseconds" },
                    { value: 1, unit: "Seconds" },
                    { value: 5, unit: "Seconds" },
                    { value: 15, unit: "Seconds" },
                    { value: 30, unit: "Seconds" },
                    { value: 1, unit: "Minutes" },
                    { value: 5, unit: "Minutes" },
                    { value: 15, unit: "Minutes" },
                    { value: 30, unit: "Minutes" },
                    { value: 1, unit: "Hours" },
                    { value: 3, unit: "Hours" },
                    { value: 6, unit: "Hours" },
                    { value: 12, unit: "Hours" },
                    { value: 1, unit: "Date" },
                    { value: 2, unit: "Date" },
                    { value: 7, unit: "Date" },
                    { value: 1, unit: "Month" },
                    { value: 3, unit: "Month" },
                    { value: 1, unit: "FullYear" },
                    { value: 2, unit: "FullYear" },
                    { value: 5, unit: "FullYear" },
                    { value: 10, unit: "FullYear" },
                    { value: 20, unit: "FullYear" },
                    { value: 50, unit: "FullYear" },
                    { value: 100, unit: "FullYear" },
                    { value: 200, unit: "FullYear" },
                    { value: 500, unit: "FullYear" },
                    { value: 1000, unit: "FullYear" },
                    { value: 2000, unit: "FullYear" },
                    { value: 5000, unit: "FullYear" }
                ],
                len = millis.length;

            let piece = Math.round((end.getTime() - start.getTime()) / 5),
                left = 0,
                right = len - 1,
                mid;
            while (left <= right) {
                mid = (left + right) >> 1;
                if (piece == millis[mid]) {
                    return intervals[mid];
                }
                else if (piece < millis[mid]) {
                    right = mid - 1;
                }
                else {
                    left = mid + 1;
                }
            }
            return intervals[right];
        }

        function getFirstTick() {
            let d = new Date("01 Jan 1970 00:00:00 " + start.toTimeString().slice(12, 17));
            switch (interval.unit) {
            case "FullYear":
            {
                let year = start.getFullYear();
                if (start.toDateString().slice(4, 10) !== "Jan 01" ||
                    start.toTimeString().slice(0, 8) !== "00:00:00")
                    year++;
                while (year % interval.value) { year++; }
                d.setFullYear(year);
                return d;
            }
            case "Month":
            {
                let month = start.getMonth();
                if (start.getDate() != 1 ||
                    start.toTimeString().slice(0, 8) !== "00:00:00")
                    month++;
                while (month % interval.value) { month++; }
                d.setFullYear(start.getFullYear());
                d.setMonth(month);
                return d;
            }
            case "Date": //
            {
                let day = start.getDay();
                if (start.toTimeString().slice(0, 8) !== "00:00:00")
                    day++;
                while (day % 7 % interval.value) { day++; }
                d.setFullYear(start.getFullYear());
                d.setMonth(start.getMonth());
                d.setDate(start.getDate() + day - start.getDay());
                return d;
            }
            case "Hours":
            {
                let hours = start.getHours();
                if (start.getTime() % 3600000)
                    hours++;
                while (hours % interval.value) { hours++; }
                d.setTime(start.getTime());
                d.setMilliseconds(0);
                d.setSeconds(0);
                d.setMinutes(0);
                d.setHours(hours);
                return d;
            }
            case "Minutes":
            {
                let minutes = start.getMinutes();
                if (start.getTime() % 60000)
                    minutes++;
                while (minutes % interval.value) { minutes++; }
                d.setTime(start.getTime());
                d.setMilliseconds(0);
                d.setSeconds(0);
                d.setMinutes(minutes);
                return d;
            }
            case "Seconds":
            {
                let seconds = start.getSeconds();
                if (start.getTime() % 1000)
                    seconds++;
                while (seconds % interval.value) { seconds++; }
                d.setTime(start.getTime());
                d.setMilliseconds(0);
                d.setSeconds(seconds);
                return d;
            }
            case "Milliseconds":
            {
                let millis = start.getMilliseconds();
                while (millis % interval.value) { millis++; }
                d.setTime(start.getTime());
                d.setMilliseconds(millis);
                return d;
            }
            default:
                return d.setTime(start.getTime());
            }
        }
    });
});

function append(parent, tag) {
    let elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
    $(parent).append(elem);
    return $(elem);
}