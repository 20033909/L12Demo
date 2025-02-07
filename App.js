import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Gyroscope } from 'expo-sensors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 50,
        fontWeight: 'bold',
        color: 'black',
    },
});

export default function App() {
    const [mySound, setMySound] = useState();
    const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });
    const [isShaken, setIsShaken] = useState(false);
    const [lastShakeTime, setLastShakeTime] = useState(0); // Track the time of the last shake
    const [shakeTimeout, setShakeTimeout] = useState(null); // Timer to manage duration of the "SHAKE!" state

    // Function to play sound (resetting if necessary)
    async function playSound() {
        // Stop any existing sound if it's still playing
        if (mySound) {
            await mySound.stopAsync();
            await mySound.replayAsync();
        } else {
            const soundfile = require('./assets/sound/percussion.wav');
            const { sound } = await Audio.Sound.createAsync(soundfile);
            setMySound(sound);
            await sound.playAsync();
        }
    }

    // Function to reset the SHAKE! state after 1.2 seconds
    function resetShakeState() {
        setIsShaken(false);
    }

    // Gyroscope subscription
    useEffect(() => {
        const subscription = Gyroscope.addListener((data) => {
            setGyroscopeData(data);

            const currentTime = Date.now();
            // Only trigger shake if at least 1.5 seconds have passed since the last shake
            if ((Math.abs(data.x) > 1 || Math.abs(data.y) > 1 || Math.abs(data.z) > 1) && currentTime - lastShakeTime > 1500) {
                if (!isShaken) {
                    setIsShaken(true);
                    playSound();
                    setLastShakeTime(currentTime); // Update the last shake time

                    // Set a timeout to reset the SHAKE! state after 1.2 seconds
                    if (shakeTimeout) {
                        clearTimeout(shakeTimeout); // Clear the previous timeout if it exists
                    }

                    const timeout = setTimeout(() => {
                        resetShakeState();
                    }, 1200); // Set to reset after 1.2 seconds
                    setShakeTimeout(timeout); // Store the timeout ID to clear it later
                }
            }
        });

        // Start Gyroscope updates
        Gyroscope.setUpdateInterval(100); // Adjust the update interval as needed (in ms)

        return () => {
            // Cleanup gyroscope listener and timeout when the component unmounts
            subscription.remove();
            if (shakeTimeout) {
                clearTimeout(shakeTimeout); // Clean up the timeout when unmounting
            }
        };
    }, [isShaken, lastShakeTime, mySound, shakeTimeout]); // Add shakeTimeout to the dependencies

    // Unload sound when the component is unmounted or the sound finishes playing
    useEffect(() => {
        return mySound
            ? () => {
                console.log('Sound is now running!');
                mySound.unloadAsync();
            }
            : undefined;
    }, [mySound]);

    return (
        <View style={[styles.container, { backgroundColor: isShaken ? '#f47d2f' : '#fff' }]}>
            <StatusBar />
            {isShaken ? <Text style={styles.text}>SHAKE!</Text> : null}
        </View>
    );
}
