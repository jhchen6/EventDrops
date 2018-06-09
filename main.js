let dataURL = "https://raw.githubusercontent.com/marmelab/EventDrops/master/demo/data.json";

let svg = d3.select("svg"),
    width = +svg.attr("width"),
    margin = {
        top: 20,
        right: 10,
        bottom: 20,
        left: 10
    },
    axisHeight = 30,
    timeLabelHeight = 30,
    lineHeight = 40,
    lineNameWidth = 200,
    lineWidth = width - margin.left - margin.right - lineNameWidth;

let tickNumber = 12;

let g = svg.append("g")
    .attr("class", "viewport")
    .attr("transform", "translate(" + [margin.left, margin.top] + ")");

let gAxis,
    dropLines,
    startLabel,
    endLabel,
    tooltip = d3.select(".tooltip");

let scaleOriginal = d3.scaleTime()
    .domain([new Date("May 25 2017 16:1 +0000"), new Date("May 25 2018 16:1 +0000")])
    .range([0, width - margin.left - margin.right - lineNameWidth]);

let scale = scaleOriginal;

let axis = d3.axisTop()
    .tickSizeOuter(0)
    .ticks(tickNumber);

let zoom = d3.zoom()
    .on("zoom", zoomed);

d3.json(dataURL).then(function (data) {
    data.forEach(repo => {
        repo.commits.forEach(commit => {
            commit.date = new Date(commit.date);
        });
    });

    //paint
    svg.attr("height", margin.top + margin.bottom + axisHeight + timeLabelHeight + data.length * lineHeight);

    dropLines = g.selectAll(".drop-line")
        .data(data)
        .enter().append("g")
        .attr("class", "drop-line")
        .attr("transform", (d, i) => "translate(" + [lineNameWidth, axisHeight + lineHeight * i] + ")");

    dropLines.append("line")
        .attr("class", "separator")
        .attr("x2", lineWidth)
        .attr("y1", lineHeight)
        .attr("y2", lineHeight);

    dropLines.append("g") // add filter defined in <defs>
        .attr("class", (d, i) => "drops line" + i)
        .attr("transform", "translate(0, " + lineHeight / 2 + ")");

    dropLines.append("text")
        .attr("x", -20)
        .attr("y", lineHeight / 2)
        .attr("dy", "0.3em")
        .attr("text-anchor", "end")
        .text(d => d.name);

    startLabel = g.append("g")
        .attr("class", "bound start")
        .attr("transform", "translate(" + [lineNameWidth, axisHeight + data.length * lineHeight] + ")")
        .append("text")
        .attr("y", 20);

    endLabel = g.append("g")
        .attr("class", "bound end")
        .attr("transform", "translate(" + [lineNameWidth + lineWidth, axisHeight + data.length * lineHeight] + ")")
        .append("text")
        .attr("y", 20)
        .attr("text-anchor", "end");

    gAxis = g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + [lineNameWidth, axisHeight] + ")");

    update();

    //interact
    svg.call(zoom);
});

function zoomed() {
    scale = d3.event.transform.rescaleX(scaleOriginal);
    update();
}

function update() {
    gAxis.call(axis.scale(scale));

    //drops and counts
    var countAll = 0;
    dropLines.selectAll(".drops").each(function (d) {
        let d3This = d3.select(this);
        let circles = d3This.selectAll("circle")
            .data(filter(d));
        circles.enter().append("circle")
            .attr("class", "drop")
            .attr("r", 5)
            .on("mouseenter", mouseentered)
            .on("mouseleave", mouseleaved);
        circles.exit().remove();
        d3This.selectAll("circle").attr("cx", d => scale(d.date));
    });
    dropLines.each(function (d) {
        let d3This = d3.select(this);
        d3This.select("text")
            .text(d.name + " (" + d.numFiltered + ")");
        countAll += d.numFiltered;
    });

    //start and end
    var timeSpan = scale.domain(),
        startTime = timeSpan[0],
        endTime = timeSpan[1];
    startLabel.text(startTime.toDateString().slice(4));
    endLabel.text(endTime.toDateString().slice(4));
    //infos
    d3.select("#numberCommits").text(countAll);
    d3.select("#zoomStart").text(startTime.toString().slice(4, 21));
    d3.select("#zoomEnd").text(endTime.toString().slice(4, 21));
}

function filter(d) {
    var arr = [],
        timeSpan = scale.domain(),
        startTime = timeSpan[0],
        endTime = timeSpan[1];
    d.commits.forEach(commit => {
        if (commit.date >= startTime && commit.date <= endTime) {
            arr.push(commit);
        }
    });
    d.numFiltered = arr.length;
    return arr;
}

function mouseentered(d) {
    tooltip
        .style("top", d3.event.pageY + 10 + "px")
        .style("left", d3.event.pageX - 20 + "px")
        .style("visibility", "unset");
    let author = d.author.name;
    d3.select(".avatar")
        .attr("src", "") //?
        .attr("alt", author)
        .attr("title", author);
    d3.select(".message").text(d.message);
    d3.select(".author")
        .attr("href", "https://www.github.com/" + author)
        .text(author);
    d3.select(".date").text(d.date.toString().slice(4, 21));
    d3.select(".sha")
        .attr("href", d.sha)
        .text(d.sha.slice(0, 10));
}

function mouseleaved() {
    tooltip
        .style("top", 0)
        .style("left", 0)
        .style("visibility", "hidden");
}