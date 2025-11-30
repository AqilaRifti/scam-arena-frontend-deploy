'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  HStack,
  VStack,
  Select,
  Card,
  CardBody,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Grid,
  Progress,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import type { Agent, Battle, ScamPitch, DetectionResult } from '@/lib/types';

export default function Home() {
  const toast = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [redAgent, setRedAgent] = useState('');
  const [blueAgent, setBlueAgent] = useState('');
  const [scamType, setScamType] = useState('');
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (type: 'red_team' | 'blue_team') => {
    try {
      const name = `${type === 'red_team' ? 'Scammer' : 'Detector'}-${Math.floor(Math.random() * 1000)}`;
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      const data = await response.json();
      toast({
        title: 'Agent Created',
        description: `${data.agent.name} has entered the arena`,
        status: 'success',
        duration: 3000,
      });
      loadAgents();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create agent', status: 'error' });
    }
  };

  const startBattle = async () => {
    if (!redAgent || !blueAgent) {
      toast({ title: 'Error', description: 'Select both agents', status: 'error' });
      return;
    }
    setBattleLoading(true);
    try {
      const response = await fetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redAgentId: redAgent, blueAgentId: blueAgent, scamType: scamType || undefined }),
      });
      const data = await response.json();
      setBattle(data.battle);
      toast({ title: 'Battle Started', description: 'Red Team generated a scam pitch', status: 'info' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start battle', status: 'error' });
    } finally {
      setBattleLoading(false);
    }
  };

  const resolveBattle = async () => {
    if (!battle) return;
    setAnalyzing(true);
    try {
      const response = await fetch('/api/battle/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId: battle.id }),
      });
      const data = await response.json();
      setBattle(data.battle);
      toast({
        title: data.blueTeamCorrect ? 'Blue Team Wins!' : 'Red Team Wins!',
        description: `${data.pointsAwarded} points awarded`,
        status: data.blueTeamCorrect ? 'success' : 'warning',
        duration: 5000,
      });
      loadAgents();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to analyze', status: 'error' });
    } finally {
      setAnalyzing(false);
    }
  };

  const redAgents = agents.filter((a) => a.type === 'red_team');
  const blueAgents = agents.filter((a) => a.type === 'blue_team');

  return (
    <Box minH="100vh" bg="gray.900">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} mb={10}>
          <Heading size="2xl" bgGradient="linear(to-r, red.400, orange.400)" bgClip="text">
            🎯 ScamArena
          </Heading>
          <Text fontSize="xl" color="gray.400">
            AI Agents Battle to Detect Crypto Scams
          </Text>
          <HStack spacing={4}>
            <Button colorScheme="red" onClick={() => createAgent('red_team')} size="lg">
              + Red Team Agent
            </Button>
            <Button colorScheme="blue" onClick={() => createAgent('blue_team')} size="lg">
              + Blue Team Agent
            </Button>
          </HStack>
        </VStack>

        <Tabs variant="enclosed" colorScheme="red">
          <TabList mb={4}>
            <Tab>⚔️ Battle Arena</Tab>
            <Tab>🏆 Leaderboard</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Card bg="gray.800" mb={6}>
                <CardBody>
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mb={4}>
                    <Box>
                      <Text mb={2} fontWeight="bold" color="red.400">🔴 Red Team (Scammer)</Text>
                      <Select value={redAgent} onChange={(e) => setRedAgent(e.target.value)} bg="gray.700">
                        <option value="">Select Red Agent</option>
                        {redAgents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} (W:{a.wins} L:{a.losses})</option>
                        ))}
                      </Select>
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="bold" color="blue.400">🔵 Blue Team (Detector)</Text>
                      <Select value={blueAgent} onChange={(e) => setBlueAgent(e.target.value)} bg="gray.700">
                        <option value="">Select Blue Agent</option>
                        {blueAgents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} (W:{a.wins} L:{a.losses})</option>
                        ))}
                      </Select>
                    </Box>
                  </Grid>
                  <Select value={scamType} onChange={(e) => setScamType(e.target.value)} bg="gray.700" mb={4}>
                    <option value="">Scam Type (Random)</option>
                    <option value="ponzi">Ponzi Scheme</option>
                    <option value="rug_pull">Rug Pull</option>
                    <option value="pump_dump">Pump & Dump</option>
                    <option value="fake_ico">Fake ICO</option>
                    <option value="phishing">Phishing</option>
                  </Select>
                  <Button colorScheme="red" size="lg" w="full" onClick={startBattle} isLoading={battleLoading}>
                    🚀 Start Battle
                  </Button>
                </CardBody>
              </Card>

              {battle && (
                <Card bg="gray.800">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">📜 Scam Pitch</Heading>
                      <Badge colorScheme="red" fontSize="md">{battle.scam_pitch.scamType}</Badge>
                    </HStack>
                    <Box p={4} bg="gray.700" borderRadius="md" mb={4}>
                      <Text fontWeight="bold" fontSize="xl" color="orange.300" mb={2}>
                        {battle.scam_pitch.projectName}
                      </Text>
                      <Text color="gray.300" whiteSpace="pre-wrap">{battle.scam_pitch.pitch}</Text>
                    </Box>

                    {battle.status === 'pending' && (
                      <Button colorScheme="blue" size="lg" w="full" onClick={resolveBattle} isLoading={analyzing}>
                        {analyzing ? '🔍 Blue Team Analyzing...' : '🔍 Analyze Pitch'}
                      </Button>
                    )}

                    {battle.status === 'resolved' && battle.detection_result && (
                      <>
                        <Divider my={4} />
                        <Heading size="md" mb={4}>🎯 Detection Result</Heading>
                        <Box p={4} bg={battle.blue_team_correct ? 'green.900' : 'red.900'} borderRadius="md" mb={4}>
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold" fontSize="lg">
                              {battle.detection_result.isScam ? '🚨 SCAM DETECTED' : '✅ APPEARS LEGITIMATE'}
                            </Text>
                            <Badge colorScheme={battle.blue_team_correct ? 'green' : 'red'} fontSize="md">
                              {battle.blue_team_correct ? 'CORRECT' : 'INCORRECT'}
                            </Badge>
                          </HStack>
                          <Text mb={2}>Confidence: {battle.detection_result.confidence}%</Text>
                          <Progress value={battle.detection_result.confidence} colorScheme="blue" mb={4} />
                          <Text color="gray.300">{battle.detection_result.reasoning}</Text>

                          {battle.detection_result.detectedFlags.length > 0 && (
                            <Box mt={4}>
                              <Text fontWeight="bold" mb={2}>🚩 Red Flags:</Text>
                              {battle.detection_result.detectedFlags.map((flag, i) => (
                                <Box key={i} p={2} bg="gray.800" borderRadius="md" mb={2}>
                                  <HStack justify="space-between">
                                    <Text>{flag.flag}</Text>
                                    <Badge colorScheme={flag.severity === 'high' ? 'red' : flag.severity === 'medium' ? 'orange' : 'yellow'}>
                                      {flag.severity}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.400">{flag.explanation}</Text>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Box p={4} bg="purple.900" borderRadius="md">
                          <Text fontWeight="bold">📋 Ground Truth:</Text>
                          <Text>This was {battle.is_actually_scam ? 'actually a SCAM' : 'actually LEGITIMATE'}</Text>
                          <Text mt={2}>🏆 Points Awarded: {battle.points_awarded}</Text>
                        </Box>
                      </>
                    )}
                  </CardBody>
                </Card>
              )}
            </TabPanel>

            <TabPanel>
              <Card bg="gray.800">
                <CardBody>
                  <Heading size="md" mb={4}>🏆 Agent Leaderboard</Heading>
                  {loading ? (
                    <Spinner />
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Rank</Th>
                          <Th>Agent</Th>
                          <Th>Type</Th>
                          <Th isNumeric>Wins</Th>
                          <Th isNumeric>Losses</Th>
                          <Th isNumeric>Win Rate</Th>
                          <Th isNumeric>Points</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {agents.map((agent, index) => {
                          const total = agent.wins + agent.losses;
                          const winRate = total > 0 ? ((agent.wins / total) * 100).toFixed(1) : '0.0';
                          return (
                            <Tr key={agent.id}>
                              <Td fontWeight="bold" color="orange.400">#{index + 1}</Td>
                              <Td>{agent.name}</Td>
                              <Td>
                                <Badge colorScheme={agent.type === 'red_team' ? 'red' : 'blue'}>
                                  {agent.type === 'red_team' ? '🔴 Red' : '🔵 Blue'}
                                </Badge>
                              </Td>
                              <Td isNumeric>{agent.wins}</Td>
                              <Td isNumeric>{agent.losses}</Td>
                              <Td isNumeric>{winRate}%</Td>
                              <Td isNumeric fontWeight="bold">{agent.points}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}
