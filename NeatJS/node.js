// TODO: Review the generated Doxygen comments in this file manually later.

var activationsNames = ["Sigmoid", "Identity", "Step", "Tanh", "ReLu", "Gaussian"]; //Used in the svg drawing

/**
 * A single neuron in the CPPN genome.
 */
class Node {
	/**
	 * Create a node with the given number and layer.
	 *
	 * @param {number} num Node number.
	 * @param {number} lay Layer index.
	 * @param {boolean} isOutput True if this node is an output node.
	 */
	constructor(num, lay, isOutput) {
		this.number = num;
		this.layer = lay;
		this.activationFunction = Math.floor(random() * 6); //Number between 0 and 5
		this.bias = random() * 2 - 1;
		this.output = isOutput || false; //is this node an Output node?

		this.inputSum = 0;
		this.outputValue = 0;
		this.outputConnections = [];
	}

	/**
	 * Apply the activation function and forward the result to outgoing connections.
	 */
	engage() { //Pass down the network the calculated output value
		if (this.layer != 0) //No activation function on input nodes
			this.outputValue = this.activation(this.inputSum + this.bias);


		this.outputConnections.forEach((conn) => {
			if (conn.enabled) //Do not pass value if connection is disabled
				conn.toNode.inputSum += conn.weight * this.outputValue; //Weighted output sum
		});
	}

	/**
	 * Randomly mutate the node bias.
	 */
	mutateBias() { //Randomly mutate the bias of this node
		let rand = random();
		if (rand < 0.05) //5% chance of being assigned a new random value
			this.bias = random() * 2 - 1;
		else //95% chance of being uniformly perturbed
			this.bias += randomGaussian() / 50;
	}

	/**
	 * Randomly choose a new activation function.
	 */
	mutateActivation() { //Randomly choose a new activationFunction
		this.activationFunction = Math.floor(random() * 6); //Number between 0 and 5
	}

	/**
	 * Check whether this node is connected to another node.
	 *
	 * @param {Node} node The node to test.
	 * @returns {boolean} True if the nodes are connected.
	 */
	isConnectedTo(node) { //Check if two nodes are connected
		if (node.layer == this.layer) //nodes in the same layer cannot be connected
			return false;


		if (node.layer < this.layer) { //Check parameter node connections
			node.outputConnections.forEach((conn) => {
				if (conn.toNode == this) //Is Node connected to This?
					return true;
			});
		} else { //Check this node connections
			this.outputConnections.forEach((conn) => {
				if (conn.toNode == node) //Is This connected to Node?
					return true;
			});
		}

		return false;
	}

	/**
	 * Create a copy of this node.
	 *
	 * @returns {Node} The cloned node.
	 */
	clone() { //Returns a copy of this node
		let node = new Node(this.number, this.layer, this.output);
		node.bias = this.bias; //Same bias
		node.activationFunction = this.activationFunction; //Same activationFunction
		return node;
	}

	/**
	 * Apply the selected activation function.
	 *
	 * @param {number} x Input value.
	 * @returns {number} Activated value.
	 */
	activation(x) { //All the possible activation Functions
		switch (this.activationFunction) {
			case 0: //Sigmoid
				return 1 / (1 + Math.pow(Math.E, -4.9 * x));
				break;
			case 1: //Identity
				return x;
				break;
			case 2: //Step
				return x > 0 ? 1 : 0;
				break;
			case 3: //Tanh
				return Math.tanh(x);
				break;
			case 4: //ReLu
				return x < 0 ? 0 : x;
				break;
			case 5: //Gaussian
				return Math.exp(-Math.pow(x, 2));
				break;
			default: //Identity
				return x;
				break;
		}
	}
}