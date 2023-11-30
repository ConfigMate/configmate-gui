import { Connection } from 'vscode-languageserver/node';
import path = require('path');
import { spawn, ChildProcess } from 'child_process';

export class ConfigMateManager {
	private isShuttingDown = false;
	private readonly maxRestartAttempts = 3;
	private restartAttempts = 0;
	private cmProcess: ChildProcess | null = null;

	constructor(connection: Connection) {
		this.startCMProcess(connection);
	}

	public startCMProcess = (connection: Connection) => {
		if (this.isShuttingDown || this.restartAttempts >= this.maxRestartAttempts) return;

		const platform = process.platform;
		if (platform !== 'win32' && platform !== 'linux') {
			connection.console.error(`ConfigMate Core is not supported on platform: ${platform}`);
			return;
		}
		const isWindows = platform === 'win32';
		const exe = isWindows ? '.exe' : '';
		const cliPath = path.resolve(__dirname, `../../configmate${exe}`);
		this.cmProcess = spawn(`${cliPath}/bin/configm`, ['serve'], { shell: true });

		this.cmProcess?.stdout?.on('data', () => {
			// connection.console.log(data as string);
		});

		this.cmProcess?.stderr?.on('data', (data) => {
			connection.console.error(`ConfigMate Core error: ${data as string}`);
		});

		this.cmProcess?.on('close', () => {
			this.reset();
		});
	}

	private cleanUpCMProcess = () => {
		if (this.cmProcess && !this.cmProcess.killed && this.cmProcess.pid) {
			process.kill(-this.cmProcess.pid, 'SIGKILL');
			this.cmProcess = null;
		}
	}

	private reset = () => {
		this.isShuttingDown = false;
		this.restartAttempts = 0;
	};

	public handleShutdown = () => {
		this.isShuttingDown = true;
		this.cleanUpCMProcess();
	};
}