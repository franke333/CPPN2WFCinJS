// TODO: Review the generated Doxygen comments in this file manually later.

/**
 * A NEAT genome containing nodes, connections, and mutation logic.
 */
class Genome {
	/**
	 * Create a genome with the requested inputs and outputs.
	 *
	 * @param {number} inp Number of input nodes.
	 * @param {number} out Number of output nodes.
	 * @param {number|string} id Genome identifier.
	 * @param {boolean} offSpring True when constructing an empty child genome.
	 */
	constructor(inp, out, id, offSpring = false) {
		this.inputs = inp; //Number of inputs
		this.outputs = out; //Number of outputs
		this.id = id; //Genome id -> used for the drawing
		this.layers = 2;
		this.nextNode = 0;

		this.nodes = [];
		this.connections = [];

		if(!offSpring) { //This is not an offspring genome generate a fullyConnected net
			for (let i = 0; i < this.inputs; i++) {
				this.nodes.push(new Node(this.nextNode, 0));
				this.nextNode++;
			}

			for (let i = 0; i < this.outputs; i++) {
				let node = new Node(this.nextNode, 1, true);
				this.nodes.push(node);
				this.nextNode++;
			}


			for (let i = 0; i < this.inputs; i++) {
				for (let j = this.inputs; j < this.outputs + this.inputs; j++) {
					let weight = random() * this.inputs * Math.sqrt(2 / this.inputs);
					this.connections.push(new Connection(this.nodes[i], this.nodes[j], weight));
				}
			}
		}
	}

	/**
	 * Rebuild node output connections and sort nodes by layer.
	 */
	//Network Core
	generateNetwork() {
		//Clear all outputConnections in the nodes
		this.nodes.forEach((node) => {
			node.outputConnections.splice(0, node.outputConnections.length);
		});

		//Add the connections to the Nodes
		this.connections.forEach((conn) => {
			conn.fromNode.outputConnections.push(conn);
		});

		//Prepare for feed forward
		this.sortByLayer();
	}

	/**
	 * Evaluate the genome for a given input vector.
	 *
	 * @param {Array<number>} inputValues Input values.
	 * @returns {Array<number>} Output activations.
	 */
	feedForward(inputValues) {
		this.generateNetwork(); //Connect all up

		//Clear old inputs
		this.nodes.forEach((node) => { node.inputSum = 0; });

		//asin new inputs
		for (let i = 0; i < this.inputs; i++)
			this.nodes[i].outputValue = inputValues[i];

		//Engage all nodes and Extract the results from the outputs
		let result = [];
		this.nodes.forEach((node) => {
			node.engage();

			if (node.output)
				result.push(node.outputValue);
		});
		return result;
	}


	/**
	 * Create an offspring genome by combining this genome with a partner.
	 *
	 * @param {Genome} partner The partner genome.
	 * @returns {Genome} The offspring genome.
	 */
	//Crossover
	crossover(partner) {
		//TODO: find a good way to generate unique ids
		let offSpring = new Genome(this.inputs, this.outputs, 0, true); //Child genome
		offSpring.nextNode = this.nextNode;


		//Take all nodes from this parent - output node activation 50%-50%
		for(let i = 0; i < this.nodes.length; i++){
			let node = this.nodes[i].clone();
			if(node.output) {
				let partnerNode = partner.nodes[partner.getNode(node.number)];
				if(random() > 0.5) {
					node.activationFunction = partnerNode.activationFunction;
					node.bias = partnerNode.bias;
				}
			}
			offSpring.nodes.push(node);
		}

		//Randomly take connections from this or the partner network
		for(let i = 0; i < this.connections.length; i++) {
			let index = this.commonConnection(this.connections[i].getInnovationNumber(), partner.connections);

			if(index != -1) { //There is a commonConnection
				let conn = random() > 0.5 ? this.connections[i].clone() : partner.connections[index].clone();

				//Reassign nodes
				let fromNode = offSpring.nodes[offSpring.getNode(conn.fromNode.number)];
				let toNode = offSpring.nodes[offSpring.getNode(conn.toNode.number)];
				conn.fromNode = fromNode;
				conn.toNode = toNode;

				//Add this connection to the child
				if(fromNode && toNode)
					offSpring.connections.push(conn);
			}
			else { //No common connection -> add disjoint connections
				let conn = this.connections[i].clone();

				//Reassign nodes
				let fromNode = offSpring.nodes[offSpring.getNode(conn.fromNode.number)];
				let toNode = offSpring.nodes[offSpring.getNode(conn.toNode.number)];
				conn.fromNode = fromNode;
				conn.toNode = toNode;

				//Add this connection to the child
				if(fromNode && toNode)
					offSpring.connections.push(conn);
			}
		}

		//Add partner-only (disjoint) connections to the child and collect their indices
		for (let i = 0; i < partner.connections.length; i++) {
			let index = this.commonConnection(partner.connections[i].getInnovationNumber(), this.connections);
			if (index == -1) {
				// Clone and add the partner connection to the offspring
				let conn = partner.connections[i].clone();

				// Reassign nodes to offspring's node instances
				let fromNode = offSpring.nodes[offSpring.getNode(conn.fromNode.number)];
				let toNode = offSpring.nodes[offSpring.getNode(conn.toNode.number)];
				conn.fromNode = fromNode;
				conn.toNode = toNode;

				if (fromNode && toNode)
					offSpring.connections.push(conn);
			}
		}

		offSpring.layers = this.layers;
		return offSpring;
	}



	/**
	 * Mutate weights, biases, activations, and structure.
	 */
	//Mutation Stuff
	mutate() {
		//console.log("Mutation...");
		let mut;

		if(random() < 0.8) { //80%
			//MOD Connections
			mut = "ModConn";
			//let i = Math.floor(random() * this.connections.length);
			//this.connections[i].mutateWeight();
			for (var i = 0; i < this.connections.length; i++) {
				this.connections[i].mutateWeight();
			}
		}

		if(random() < 0.5) { //50%
			//MOD Bias
			mut = "ModBias";
			//let i = Math.floor(random() * this.nodes.length);
			//this.nodes[i].mutateBias();
			for (var i = 0; i < this.nodes.length; i++) {
				this.nodes[i].mutateBias();
			}
		}

		if(random() < 0.1) { //10%
			//MOD Node
			mut = "ModAct";
			let i = Math.floor(random() * this.nodes.length);
			this.nodes[i].mutateActivation();
		}

		if(random() < 0.05) { //5%
			//ADD Connections
			mut = "AddConn";
			this.addConnection();
		}

		if(random() < 0.01) { //1%
			//ADD Node
			mut = "AddNode";
			this.addNode();
		}
	}

	/**
	 * Split a connection by inserting a new node.
	 */
	addNode() { //Add a node to the network
		//Get a random connection to replace with a node
		let connectionIndex = Math.floor(random() * this.connections.length);
		let pickedConnection = this.connections[connectionIndex];
		pickedConnection.enabled = false;
		this.connections.splice(connectionIndex, 1); //Delete the connection

		//Create the new node
		let newNode = new Node(this.nextNode, pickedConnection.fromNode.layer + 1);
		this.nodes.forEach((node) => { //Shift all nodes layer value
			if (node.layer > pickedConnection.fromNode.layer)
				node.layer++;
		});

		//New connections
		let newConnection1 = new Connection(pickedConnection.fromNode, newNode, 1);
		let newConnection2 = new Connection(newNode, pickedConnection.toNode, pickedConnection.weight);

		this.layers++;
		this.connections.push(newConnection1); //Add connection
		this.connections.push(newConnection2); //Add connection
		this.nodes.push(newNode); //Add node
		this.nextNode++;
	}

	/**
	 * Add a new valid connection between existing nodes.
	 */
	addConnection() { //Add a connection to the network
		if (this.fullyConnected())
			return; //Cannot add connections if it's fullyConnected

		//Choose to nodes to connect
		let node1 = Math.floor(random() * this.nodes.length);
		let node2 = Math.floor(random() * this.nodes.length);

		//Search for two valid nodes
		while (this.nodes[node1].layer == this.nodes[node2].layer
			|| this.nodesConnected(this.nodes[node1], this.nodes[node2])) {
			node1 = Math.floor(random() * this.nodes.length);
			node2 = Math.floor(random() * this.nodes.length);
		}

		//Switch nodes based on their layer
		if (this.nodes[node1].layer > this.nodes[node2].layer) {
			let temp = node1;
			node1 = node2;
			node2 = temp;
		}

		//add the connection
		let newConnection = new Connection(this.nodes[node1], this.nodes[node2], random() * this.inputs * Math.sqrt(2 / this.inputs));
		this.connections.push(newConnection);
	}



	/**
	 * Find the index of a connection by innovation number.
	 *
	 * @param {number} innN Innovation number.
	 * @param {Array<Connection>} connections Connection list to search.
	 * @returns {number} Matching index or -1.
	 */
	//Utilities
	commonConnection(innN, connections) {
		//Search through all connections to check for
		//one with the correct Innovation Number
		for(let i = 0; i < connections.length; i++){
			if(innN == connections[i].getInnovationNumber())
				return i;
		}

		//Found nothing
		return -1;
	}

	/**
	 * Check whether two nodes are already connected.
	 *
	 * @param {Node} node1 First node.
	 * @param {Node} node2 Second node.
	 * @returns {boolean} True if the nodes are connected.
	 */
	nodesConnected(node1, node2) {
		//Search if there is a connection between node1 & node2
		for (let i = 0; i < this.connections.length; i++) {
			let conn = this.connections[i];
			if ((conn.fromNode == node1 && conn.toNode == node2)
				|| (conn.fromNode == node2 && conn.toNode == node1)) {
				return true;
			}
		};

		return false;
	}

	/**
	 * Check whether all allowed layer-to-layer connections already exist.
	 *
	 * @returns {boolean} True if the genome is fully connected.
	 */
	fullyConnected() {
		//check if the network is fully connected
		let maxConnections = 0;
		let nodesPerLayer = [];

		//Calculate all possible connections
		this.nodes.forEach((node) => {
			if (nodesPerLayer[node.layer] != undefined)
				nodesPerLayer[node.layer]++;
			else
				nodesPerLayer[node.layer] = 1;
		});

		//remove empty layers
		nodesPerLayer = nodesPerLayer.filter((x) => { return x != undefined && x > 0; });
		let numberOfLayers = nodesPerLayer.length;

		for (let i = 0; i < numberOfLayers - 1; i++)
			for (let j = i + 1; j < numberOfLayers; j++)
				maxConnections += nodesPerLayer[i] * nodesPerLayer[j];

		//Compare
		return maxConnections == this.connections.length;
	}

	/**
	 * Sort nodes by ascending layer index.
	 */
	sortByLayer(){
		//Sort all nodes by layer
		this.nodes.sort((a, b) => {
			return a.layer - b.layer;
		});
	}

	/**
	 * Create a deep copy of this genome.
	 *
	 * @returns {Genome} The cloned genome.
	 */
	clone() { //Returns a copy of this genome
		let clone = new Genome(this.inputs, this.outputs, this.id, true);
		clone.layers = this.layers;
		clone.nextNode = this.nextNode;

		const nodeLookup = new Map();
		clone.nodes = this.nodes.map((node) => {
			const clonedNode = node.clone();
			nodeLookup.set(node.number, clonedNode);
			return clonedNode;
		});

		clone.connections = this.connections.map((connection) => {
			const clonedConnection = connection.clone();
			clonedConnection.fromNode = nodeLookup.get(connection.fromNode.number);
			clonedConnection.toNode = nodeLookup.get(connection.toNode.number);
			return clonedConnection;
		});

		return clone;
	}

	/**
	 * Find the index of a node by node number.
	 *
	 * @param {number} x Node number.
	 * @returns {number} Matching index or -1.
	 */
	getNode(x){ //Returns the index of a node with that Number
		for(let i = 0; i < this.nodes.length; i++)
			if(this.nodes[i].number == x)
				return i;

		return -1;
	}

	/**
	 * Estimate the computational weight of the genome.
	 *
	 * @returns {number} The weight estimate.
	 */
	calculateWeight() { //Computational weight of the network
		return this.connections.length + this.nodes.length;
	}

	/**
	 * Render the genome as an SVG visualization.
	 *
	 * @param {number} width SVG width.
	 * @param {number} height SVG height.
	 * @param {string} container Container element id.
	 */
	draw(width = 400, height = 400, container = "svgContainer") { //Draw the genome to a svg
		var element = document.getElementById(this.id);
		if (element)
			element.parentNode.removeChild(element);

		var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("id", this.id);


		var force = d3.layout.force()
			.gravity(.05)
			.distance(100)
			.charge(-100)
			.size([width, height]);


		let connections = [];
		this.connections.forEach(conn => {
			connections.push({ source: this.getNode(conn.fromNode.number), target: this.getNode(conn.toNode.number), weight: conn.weight, enabled: conn.enabled });
		});

		let nodes = [];
		this.nodes.forEach(originalNode => {
			let node = originalNode.clone();
			if(node.layer == 0) {
				node.fixed = true;
				node.y =  height - (height * 0.2);
				node.x = ((width/this.inputs) * node.number) + (width/this.inputs)/2;
			}

			if(node.output) {
				node.fixed = true;
				node.y =  (height * 0.2);
				node.x = ((width/this.outputs) * (node.number - this.inputs)) + (width/this.outputs)/2;
			}

			nodes.push(node);
		});

		force.nodes(nodes)
			.links(connections)
			.start();

		var link = svg.selectAll(".link")
			.data(connections)
			.enter().append("line")
			.attr("class", "link")
			.style("stroke-width", function (d) { return d.enabled ? (d.weight > 0 ? 0.3 + d.weight : 0.3 + d.weight*-1) : 0 })
			.style("stroke", function (d) { return d.weight > 0 ? "#0f0" : "#f00"; });

		var node = svg.selectAll(".node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node")
			.call(force.drag);

		node.append("circle")
			.attr("r", "5")
			.attr("fill", function (d) { return d.layer == 0 ? "#00f" : d.output ? "#f00" : "#000" });

		node.append("text")
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text(function(d) { return d.number + (d.layer > 0 ? "(" + activationsNames[d.activationFunction] + ")" : null) });

		force.on("tick", function () {
			link.attr("x1", function (d) { return d.source.x; })
				.attr("y1", function (d) { return d.source.y; })
				.attr("x2", function (d) { return d.target.x; })
				.attr("y2", function (d) { return d.target.y; });

			node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
		});

		var element = document.getElementById(this.id);
		document.getElementById(container).append(element);
	}
}
